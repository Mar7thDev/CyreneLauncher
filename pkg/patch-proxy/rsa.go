//go:build windows

package patchproxy

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// rsaFieldRE matches base64 RSA public key values inside known JSON fields.
//
//	Group 1 — `"fieldName": "`  (field name + colon + opening quote)
//	Group 2 — base64 value (64+ chars)           ← replaced by server key
//	Group 3 — closing `"`
var rsaFieldRE = regexp.MustCompile(
	`("(?:rsa_public_key|client_secret_key|dispatch_seed)"\s*:\s*")([A-Za-z0-9+/=]{64,})(")`,
)

// rsaXMLRE matches the <RSAKeyValue>…</RSAKeyValue> XML format used by the
// miHoYo SDK (il2cpp RSAEncrypt / MiHoYoSDKUtil).
var rsaXMLRE = regexp.MustCompile(`(?s)<RSAKeyValue>.+?</RSAKeyValue>`)

// escapeReplacement escapes `$` so regexp.ReplaceAll treats them as literals.
func escapeReplacement(s string) string {
	return strings.ReplaceAll(s, "$", "$$")
}

// patchRSAInBody scans body for known RSA public key patterns and replaces
// every occurrence with serverKey. Only operates on text / JSON content.
// Returns body unchanged when serverKey is empty or content is binary.
func patchRSAInBody(body []byte, contentType, serverKey string) []byte {
	if serverKey == "" {
		return body
	}
	ct := strings.ToLower(contentType)
	if !strings.Contains(ct, "json") && !strings.Contains(ct, "text") {
		return body
	}

	// Base64 RSA key fields in JSON.
	if bytes.ContainsAny(body, "rsa_public_key") ||
		bytes.Contains(body, []byte("rsa_public_key")) ||
		bytes.Contains(body, []byte("client_secret_key")) ||
		bytes.Contains(body, []byte("dispatch_seed")) {
		repl := []byte("${1}" + escapeReplacement(serverKey) + "${3}")
		body = rsaFieldRE.ReplaceAll(body, repl)
	}

	// XML-format RSA keys (MiHoYoSDKUtil path).
	if bytes.Contains(body, []byte("<RSAKeyValue>")) {
		body = rsaXMLRE.ReplaceAll(body, []byte(escapeReplacement(serverKey)))
	}

	return body
}

// fetchServerRSAKey contacts the target server at common dispatch endpoints
// and returns the first RSA public key it finds, or "" on failure.
// Uses InsecureSkipVerify so it works with self-signed certs on the custom server.
func fetchServerRSAKey(targetBaseURL string) string {
	probes := []struct{ method, path string }{
		{"GET", "/query_dispatch"},
		{"POST", "/query_dispatch"},
		{"GET", "/query_gateway"},
		{"POST", "/query_gateway"},
	}
	cl := &http.Client{
		Timeout: 6 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec
		},
	}
	base := strings.TrimRight(targetBaseURL, "/")
	for _, p := range probes {
		req, err := http.NewRequest(p.method, base+p.path, nil)
		if err != nil {
			continue
		}
		resp, err := cl.Do(req)
		if err != nil {
			continue
		}
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 256<<10)) // 256 KiB
		resp.Body.Close()
		if resp.StatusCode >= 400 {
			continue
		}
		if key := extractRSAKeyFromJSON(body); key != "" {
			return key
		}
	}
	return ""
}

// extractRSAKeyFromJSON parses a JSON blob and returns the value of the first
// field whose name matches a known RSA key field and whose value is a non-trivial
// base64 string.
func extractRSAKeyFromJSON(body []byte) string {
	var top interface{}
	if err := json.Unmarshal(body, &top); err != nil {
		return ""
	}
	return searchRSAInValue(top)
}

func searchRSAInValue(v interface{}) string {
	switch t := v.(type) {
	case map[string]interface{}:
		return searchRSAInMap(t)
	case []interface{}:
		for _, elem := range t {
			if k := searchRSAInValue(elem); k != "" {
				return k
			}
		}
	}
	return ""
}

var rsaKeyFieldNames = map[string]bool{
	"rsa_public_key":    true,
	"client_secret_key": true,
	"dispatch_seed":     true,
}

func searchRSAInMap(m map[string]interface{}) string {
	for k, v := range m {
		if rsaKeyFieldNames[k] {
			if s, ok := v.(string); ok && len(s) >= 64 {
				return s
			}
		}
	}
	// Recurse into nested objects and arrays.
	for _, v := range m {
		if k := searchRSAInValue(v); k != "" {
			return k
		}
	}
	return ""
}
