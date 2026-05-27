//go:build windows

// Package patchproxy implements the Go-native March7thHoney patch:
// a loopback HTTPS MITM proxy that intercepts miHoYo-domain traffic and
// forwards it to a configurable private server, together with helpers for
// managing the proxy root CA and the Windows system proxy settings.
package patchproxy

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"os"
	"sync"
	"time"
)

const (
	caCertFile = "./patch/cyrene-ca.pem"
	caKeyFile  = "./patch/cyrene-ca-key.pem"
	caCN       = "Cyrene Launcher Proxy"
)

// caState holds the proxy root CA and a cache of per-hostname leaf certs.
type caState struct {
	cert    *x509.Certificate
	certPEM []byte
	key     *ecdsa.PrivateKey

	leafMu sync.Mutex
	leaves map[string]tls.Certificate
}

// getCA loads the proxy root CA from disk, or generates and persists a new one
// when none exists or the existing cert is about to expire.
func getCA() (*caState, error) {
	ca := &caState{leaves: make(map[string]tls.Certificate)}

	certPEM, certErr := os.ReadFile(caCertFile)
	keyPEM, keyErr := os.ReadFile(caKeyFile)
	if certErr == nil && keyErr == nil {
		if tlsCert, err := tls.X509KeyPair(certPEM, keyPEM); err == nil {
			if cert, err := x509.ParseCertificate(tlsCert.Certificate[0]); err == nil {
				if time.Now().Before(cert.NotAfter.Add(-48 * time.Hour)) {
					ca.cert = cert
					ca.certPEM = certPEM
					ca.key = tlsCert.PrivateKey.(*ecdsa.PrivateKey)
					return ca, nil
				}
			}
		}
	}

	// Generate a new root CA.
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}
	serial, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		return nil, err
	}
	tmpl := &x509.Certificate{
		SerialNumber:          serial,
		Subject:               pkix.Name{CommonName: caCN, Organization: []string{"Cyrene"}},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(10 * 365 * 24 * time.Hour),
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
	}
	certDER, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	if err != nil {
		return nil, err
	}
	cert, err := x509.ParseCertificate(certDER)
	if err != nil {
		return nil, err
	}

	certPEM = pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})
	keyDER, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		return nil, err
	}

	_ = os.MkdirAll("./patch", 0755)
	_ = os.WriteFile(caCertFile, certPEM, 0644)
	_ = os.WriteFile(caKeyFile, pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER}), 0600)

	ca.cert = cert
	ca.certPEM = certPEM
	ca.key = key
	return ca, nil
}

// leafCert returns a cached (or freshly-generated) TLS leaf certificate for
// hostname, signed by the proxy CA.
func (ca *caState) leafCert(hostname string) (tls.Certificate, error) {
	ca.leafMu.Lock()
	if c, ok := ca.leaves[hostname]; ok {
		ca.leafMu.Unlock()
		return c, nil
	}
	ca.leafMu.Unlock()

	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return tls.Certificate{}, err
	}
	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	tmpl := &x509.Certificate{
		SerialNumber: serial,
		Subject:      pkix.Name{CommonName: hostname},
		DNSNames:     []string{hostname},
		NotBefore:    time.Now().Add(-time.Minute),
		NotAfter:     time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	certDER, err := x509.CreateCertificate(rand.Reader, tmpl, ca.cert, &key.PublicKey, ca.key)
	if err != nil {
		return tls.Certificate{}, err
	}
	c := tls.Certificate{Certificate: [][]byte{certDER}, PrivateKey: key}

	ca.leafMu.Lock()
	ca.leaves[hostname] = c
	ca.leafMu.Unlock()
	return c, nil
}
