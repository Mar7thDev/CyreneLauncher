//go:build windows

package patchproxy

import (
	"bufio"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
)

// redirectDomains lists the domain suffixes whose HTTPS traffic the proxy
// intercepts and forwards to the target server. Subdomains also match.
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

// Proxy is a loopback HTTP CONNECT proxy. CONNECT tunnels whose hostname
// matches a redirect domain are MITM'd (our CA cert presented, traffic
// forwarded to Target). All other CONNECT requests are tunnelled directly.
type Proxy struct {
	target   *url.URL
	ca       *caState
	ln       net.Listener
	stopOnce sync.Once
	wg       sync.WaitGroup
}

// New creates a Proxy that forwards intercepted traffic to targetURL.
// targetURL must be an absolute URL with a host (e.g. "https://march7th.hoyotoon.com").
func New(targetURL string) (*Proxy, error) {
	u, err := url.Parse(targetURL)
	if err != nil || u.Host == "" {
		return nil, fmt.Errorf("invalid target URL %q", targetURL)
	}
	ca, err := getCA()
	if err != nil {
		return nil, fmt.Errorf("CA setup: %w", err)
	}
	return &Proxy{target: u, ca: ca}, nil
}

// CA exposes the proxy root CA so the caller can install it in the OS trust store.
func (p *Proxy) CA() *caState { return p.ca }

// Start begins listening on a random loopback port and returns that port.
func (p *Proxy) Start() (int, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, fmt.Errorf("listen: %w", err)
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
	req, err := http.ReadRequest(bufio.NewReader(conn))
	if err != nil {
		return
	}
	if req.Method != http.MethodConnect {
		return
	}
	host := req.Host
	hostname, _, _ := net.SplitHostPort(host)
	if hostname == "" {
		hostname = host
	}
	// Acknowledge the tunnel regardless — game expects 200.
	_, _ = conn.Write([]byte("HTTP/1.1 200 Connection Established\r\n\r\n"))

	if p.shouldMITM(hostname) {
		p.mitm(conn, hostname)
	} else {
		p.tunnel(conn, host)
	}
}

func (p *Proxy) shouldMITM(hostname string) bool {
	h := strings.ToLower(hostname)
	for _, d := range redirectDomains {
		if h == d || strings.HasSuffix(h, "."+d) {
			return true
		}
	}
	return false
}

// tunnel blindly copies bytes in both directions between conn and the upstream
// address — used for domains we don't intercept.
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

// mitm performs a TLS man-in-the-middle on conn for hostname. It presents a
// leaf cert signed by our CA, reads HTTP requests, and forwards each to the
// configured target server.
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

	scheme := p.target.Scheme
	if scheme == "" {
		scheme = "https"
	}
	targetHost := p.target.Host

	upClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{ServerName: targetHost},
		},
		// Don't follow redirects automatically — pass them back to the game.
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	br := bufio.NewReader(tlsConn)
	for {
		req, err := http.ReadRequest(br)
		if err != nil {
			return
		}

		outURL := &url.URL{
			Scheme:   scheme,
			Host:     targetHost,
			Path:     req.URL.Path,
			RawQuery: req.URL.RawQuery,
		}
		outReq, err := http.NewRequest(req.Method, outURL.String(), req.Body)
		if err != nil {
			return
		}
		outReq.Header = req.Header.Clone()
		outReq.Header.Set("Host", targetHost)
		outReq.Host = targetHost

		resp, err := upClient.Do(outReq)
		if err != nil {
			_, _ = fmt.Fprintf(tlsConn,
				"HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
			return
		}
		_ = resp.Write(tlsConn)
		resp.Body.Close()

		// Close the MITM session if either side signals Connection: close,
		// or if the client is HTTP/1.0 (no persistent connections).
		if strings.EqualFold(resp.Header.Get("Connection"), "close") ||
			strings.EqualFold(req.Header.Get("Connection"), "close") ||
			(req.ProtoMajor == 1 && req.ProtoMinor == 0) {
			return
		}
	}
}
