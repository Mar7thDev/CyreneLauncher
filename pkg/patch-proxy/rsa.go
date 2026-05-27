//go:build windows

package patchproxy

import (
	"bytes"
	"regexp"
	"strings"
)

// rsaFieldRE matches base64 RSA public key values inside known JSON fields.
//
//	Group 1 — `"fieldName": "`  (field name + colon + opening quote)
//	Group 2 — base64 value (64+ chars)        ← replaced by target key
//	Group 3 — closing `"`
var rsaFieldRE = regexp.MustCompile(
	`("(?:rsa_public_key|client_secret_key|dispatch_seed)"\s*:\s*")([A-Za-z0-9+/=]{64,})(")`,
)

// rsaXMLRE matches <RSAKeyValue>…</RSAKeyValue> XML format used by the
// miHoYo SDK (MiHoYoSDKUtil::RSAEncrypt path).
var rsaXMLRE = regexp.MustCompile(`(?s)<RSAKeyValue>.+?</RSAKeyValue>`)

// escapeReplacement escapes `$` so regexp.ReplaceAll treats them as literals.
func escapeReplacement(s string) string {
	return strings.ReplaceAll(s, "$", "$$")
}

// patchRSAInBody scans body for known RSA public key patterns and replaces
// every occurrence with targetKey.
// Only operates on text/JSON content; returns body unchanged for binary responses
// or when targetKey is empty.
func patchRSAInBody(body []byte, contentType, targetKey string) []byte {
	if targetKey == "" {
		return body
	}
	ct := strings.ToLower(contentType)
	if !strings.Contains(ct, "json") && !strings.Contains(ct, "text") {
		return body
	}

	// Base64 RSA key fields in JSON.
	if bytes.Contains(body, []byte("rsa_public_key")) ||
		bytes.Contains(body, []byte("client_secret_key")) ||
		bytes.Contains(body, []byte("dispatch_seed")) {
		repl := []byte("${1}" + escapeReplacement(targetKey) + "${3}")
		body = rsaFieldRE.ReplaceAll(body, repl)
	}

	// XML-format RSA keys (MiHoYoSDKUtil path).
	if bytes.Contains(body, []byte("<RSAKeyValue>")) {
		body = rsaXMLRE.ReplaceAll(body, []byte(escapeReplacement(targetKey)))
	}

	return body
}
