//go:build windows

package patchproxy

import (
	"regexp"
	"strings"
)

// redirectURLRE matches any http(s) URL whose host is (or is a subdomain of)
// a redirect domain.
//
//	Group 1 — scheme ("http" or "https")
//	Group 2 — host (including any subdomain)            ← replaced by target host
//	Group 3 — path + query + fragment (may be empty)    ← preserved as-is
var redirectURLRE = buildRedirectURLRE()

func buildRedirectURLRE() *regexp.Regexp {
	escaped := make([]string, len(redirectDomains))
	for i, d := range redirectDomains {
		escaped[i] = regexp.QuoteMeta(d)
	}
	// (?:[a-zA-Z0-9-]+\.)* — zero or more subdomain labels, each ending in "."
	// The anchored domain pattern ensures e.g. "fakemihoyo.com" doesn't match.
	hostPat := `(?:[a-zA-Z0-9-]+\.)*(?:` + strings.Join(escaped, "|") + `)`
	// Path/query/fragment: everything that can legally follow a host in a URL,
	// up to a whitespace or typical delimiter character.
	pathPat := `(/[^\s"'<>]*)?`
	return regexp.MustCompile(`(https?)://` + `(` + hostPat + `)` + pathPat)
}

// patchURLsInBody rewrites URLs in body that point to a redirect domain so
// they instead point to targetScheme://targetHost (path preserved).
//
// Applied to text/html, text/javascript, application/json, and similar textual
// content types; binary responses are returned unchanged.
// URLs that already point to targetHost are left alone.
func patchURLsInBody(body []byte, contentType, targetScheme, targetHost string) []byte {
	ct := strings.ToLower(contentType)
	if !strings.Contains(ct, "json") &&
		!strings.Contains(ct, "html") &&
		!strings.Contains(ct, "javascript") &&
		!strings.Contains(ct, "text") {
		return body
	}

	return redirectURLRE.ReplaceAllFunc(body, func(match []byte) []byte {
		// Extract the captured groups.
		sub := redirectURLRE.FindSubmatch(match)
		if sub == nil {
			return match
		}
		host := string(sub[2])
		// Don't rewrite URLs that already point to the target.
		if strings.EqualFold(host, targetHost) {
			return match
		}
		path := sub[3]
		return append([]byte(targetScheme+"://"+targetHost), path...)
	})
}
