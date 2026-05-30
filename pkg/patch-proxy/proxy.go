//go:build windows

package patchproxy

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
)

// redirectDomains lists the domain suffixes whose traffic the proxy intercepts
// and forwards to the target server. Subdomains also match.
var redirectDomains = []string{
	"hoyoverse.com",
	"mihoyo.com",
	"yuanshen.com",
	"starrails.com",
	"bhsr.com",
	"bh3.com",
	"honkaiimpact3.com",
	"zenlesszonezero.com",
}

// Proxy is a loopback forwarding proxy that the game routes its traffic through
// (configured as a named WinHTTP/WinINet/libcurl proxy by CyreneHook.dll).
//
// It behaves like a complete HTTP/HTTPS proxy — the same role Titanium.Web.Proxy
// fills in the reference C# launcher:
//
//   - Plain HTTP requests arrive in absolute form ("GET http://host/path …").
//     Requests to a redirect domain are rewritten to the target server; all
//     others are forwarded to their original destination.
//   - HTTPS arrives as CONNECT. Tunnels to a redirect domain are MITM'd (our CA
//     leaf cert presented, traffic forwarded to the target, response bodies
//     optionally patched). All other CONNECTs are tunnelled byte-for-byte.
type Proxy struct {
	target   *url.URL
	ca       *caState
	client   *http.Client
	rsaKey   string   // resolved once from opts; "" disables RSA patching
	webHosts []string // resolved once from opts; empty disables URL rewriting
	ln       net.Listener
	stopOnce sync.Once
	wg       sync.WaitGroup
}

// New creates a Proxy that forwards intercepted traffic to targetURL.
// targetURL must be an absolute URL with a host (e.g. "https://march7th.hoyotoon.com").
// opts controls optional RSA key patching and webpage URL rewriting.
func New(targetURL string, opts PatchOptions) (*Proxy, error) {
	u, err := url.Parse(targetURL)
	if err != nil || u.Host == "" {
		return nil, fmt.Errorf("invalid target URL %q", targetURL)
	}
	ca, err := getCA()
	if err != nil {
		return nil, fmt.Errorf("CA setup: %w", err)
	}

	p := &Proxy{
		target: u,
		ca:     ca,
		client: &http.Client{
			Transport: &http.Transport{
				// The target may be a private server with a self-signed cert (or
				// plain HTTP). Upstream cert validation is not a security boundary
				// for a local redirect proxy, so skip it.
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
			// Pass redirects back to the game instead of following them.
			CheckRedirect: func(*http.Request, []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}
	if opts.RSAPatch {
		p.rsaKey = opts.ResolvedRSAKey()
	}
	if opts.WebRedirect {
		p.webHosts = opts.ResolvedWebHosts()
	}
	return p, nil
}

// CA exposes the proxy root CA so the caller can install it in the OS trust store.
func (p *Proxy) CA() *caState { return p.ca }

// Start begins listening and returns the bound port. preferredPort is tried
// first; if it is 0 or unavailable, a random free loopback port is used.
func (p *Proxy) Start(preferredPort int) (int, error) {
	var ln net.Listener
	var err error
	if preferredPort > 0 {
		ln, err = net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", preferredPort))
	}
	if ln == nil {
		ln, err = net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			return 0, fmt.Errorf("listen: %w", err)
		}
	}
	p.ln = ln
	go p.accept()
	return ln.Addr().(*net.TCPAddr).Port, nil
}

// Stop closes the listener and waits for all in-flight connections to finish.
func (p *Proxy) Stop() {
	p.stopOnce.Do(func() { p.ln.Close() })
	p.wg.Wait()
}

func (p *Proxy) accept() {
	for {
		conn, err := p.ln.Accept()
		if err != nil {
			return
		}
		p.wg.Add(1)
		go func(c net.Conn) {
			defer p.wg.Done()
			p.handle(c)
		}(conn)
	}
}

func (p *Proxy) handle(conn net.Conn) {
	defer conn.Close()
	br := bufio.NewReader(conn)
	req, err := http.ReadRequest(br)
	if err != nil {
		return
	}

	if req.Method == http.MethodConnect {
		host := req.Host
		hostname := hostOnly(host)
		// Acknowledge the tunnel regardless — the client expects 200.
		if _, err := conn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n")); err != nil {
			return
		}
		// Wrap so any bytes bufio already read past the CONNECT line (e.g. a
		// pipelined TLS ClientHello) are not lost by the TLS server / tunnel.
		bc := &bufferedConn{r: br, Conn: conn}
		if p.matchRedirect(hostname) {
			p.mitm(bc, hostname)
		} else {
			p.tunnel(bc, host)
		}
		return
	}

	// Plain HTTP through a named proxy: requests arrive in absolute form and
	// the connection may carry several of them (keep-alive).
	for {
		if !p.forward(conn, req, false, "") {
			return
		}
		req, err = http.ReadRequest(br)
		if err != nil {
			return
		}
	}
}

// mitm performs a TLS man-in-the-middle on conn for hostname, then serves the
// decrypted HTTP requests as a forwarding proxy (always to the target, since
// only redirect domains are MITM'd).
func (p *Proxy) mitm(conn net.Conn, hostname string) {
	cert, err := p.ca.leafCert(hostname)
	if err != nil {
		return
	}
	tlsConn := tls.Server(conn, &tls.Config{Certificates: []tls.Certificate{cert}})
	if err := tlsConn.Handshake(); err != nil {
		tlsConn.Close()
		return
	}
	defer tlsConn.Close()

	br := bufio.NewReader(tlsConn)
	for {
		req, err := http.ReadRequest(br)
		if err != nil {
			return
		}
		if !p.forward(tlsConn, req, true, hostname) {
			return
		}
	}
}

// tunnel blindly copies bytes in both directions — used for CONNECT tunnels to
// domains we don't intercept.
func (p *Proxy) tunnel(conn net.Conn, addr string) {
	up, err := net.Dial("tcp", addr)
	if err != nil {
		return
	}
	defer up.Close()
	done := make(chan struct{}, 1)
	go func() {
		_, _ = io.Copy(up, conn)
		done <- struct{}{}
	}()
	_, _ = io.Copy(conn, up)
	<-done
}

// forward sends one request upstream and writes the response back to w.
// isTLS marks a request that arrived over a MITM'd TLS connection; mitmHost is
// the SNI host for such requests (their request line is origin-form).
// It returns whether the connection should be kept alive for another request.
func (p *Proxy) forward(w io.Writer, req *http.Request, isTLS bool, mitmHost string) bool {
	host := req.Host
	if host == "" && req.URL != nil {
		host = req.URL.Host
	}
	if host == "" {
		host = mitmHost
	}
	hostname := hostOnly(host)

	scheme := "http"
	if isTLS {
		scheme = "https"
	}
	outHost := host
	if p.matchRedirect(hostname) {
		outHost = p.target.Host
		if s := p.target.Scheme; s != "" {
			scheme = s
		}
	}

	outURL := &url.URL{
		Scheme:   scheme,
		Host:     outHost,
		Path:     req.URL.Path,
		RawQuery: req.URL.RawQuery,
	}
	outReq := &http.Request{
		Method:        req.Method,
		URL:           outURL,
		Header:        req.Header.Clone(),
		Body:          req.Body,
		ContentLength: req.ContentLength,
		Host:          outHost,
	}
	outReq.Header.Del("Proxy-Connection")

	// When patching response bodies, drop Accept-Encoding so Go's transport
	// transparently handles gzip and hands us the decompressed body.
	patching := p.rsaKey != "" || len(p.webHosts) > 0
	if patching {
		outReq.Header.Del("Accept-Encoding")
	}

	resp, err := p.client.Do(outReq)
	if err != nil {
		_, _ = io.WriteString(w,
			"HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
		return false
	}
	defer resp.Body.Close()

	// For text/JSON responses, buffer and apply body patches (RSA key + URL
	// rewrites). Binary responses pass through untouched.
	ct := resp.Header.Get("Content-Type")
	if patching && isTextContent(ct) {
		raw, readErr := io.ReadAll(io.LimitReader(resp.Body, 8<<20)) // 8 MiB cap
		if readErr == nil {
			if p.rsaKey != "" {
				raw = patchRSAInBody(raw, ct, p.rsaKey)
			}
			if len(p.webHosts) > 0 {
				raw = patchURLsInBody(raw, ct, p.target.Scheme, p.target.Host, p.webHosts)
			}
			// Body is now identity-encoded; advertise it as such.
			resp.Header.Del("Content-Encoding")
			resp.Header.Del("Content-Length")
			resp.TransferEncoding = nil
			resp.ContentLength = int64(len(raw))
			resp.Body = io.NopCloser(bytes.NewReader(raw))
		}
	}

	keepAlive := !req.Close && !resp.Close &&
		!strings.EqualFold(resp.Header.Get("Connection"), "close")
	if err := resp.Write(w); err != nil {
		return false
	}
	return keepAlive
}

// matchRedirect reports whether hostname's traffic should be redirected to the
// target server. The target's own host is never redirected (avoids loops).
func (p *Proxy) matchRedirect(hostname string) bool {
	h := strings.ToLower(hostname)
	if h == strings.ToLower(p.target.Hostname()) {
		return false
	}
	for _, d := range redirectDomains {
		if h == d || strings.HasSuffix(h, "."+d) {
			return true
		}
	}
	return false
}

// hostOnly strips an optional :port from a host[:port] string.
func hostOnly(host string) string {
	if h, _, err := net.SplitHostPort(host); err == nil {
		return h
	}
	return host
}

// isTextContent reports whether the Content-Type indicates a textual payload
// (JSON, HTML, JS, plain text, …) that may be buffered for body patching.
func isTextContent(contentType string) bool {
	ct := strings.ToLower(contentType)
	return strings.Contains(ct, "json") ||
		strings.Contains(ct, "html") ||
		strings.Contains(ct, "javascript") ||
		strings.Contains(ct, "text")
}

// bufferedConn is a net.Conn whose reads are served from a bufio.Reader first
// (so bytes pre-read past a CONNECT request line are not lost), while writes go
// straight to the underlying connection.
type bufferedConn struct {
	r *bufio.Reader
	net.Conn
}

func (b *bufferedConn) Read(p []byte) (int, error) { return b.r.Read(p) }
