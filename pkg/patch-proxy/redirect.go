//go:build windows

package patchproxy

import (
	"regexp"
	"strings"
	"sync"
)

// webHostsRE caches compiled regexps keyed by the sorted host list string
// so we don't recompile on every request.
var (
	reMu    sync.Mutex
	reCache = map[string]*regexp.Regexp{}
)

// urlREForHosts returns a compiled regexp that matches http(s):// URLs whose
// host is exactly one of the provided hosts (case-insensitive).
//
//	Group 1 — scheme
//	Group 2 — host (exact match)
//	Group 3 — path + query + fragment (may be empty)
func urlREForHosts(hosts []string) *regexp.Regexp {
	key := strings.Join(hosts, "|")
	reMu.Lock()
	defer reMu.Unlock()
	if re, ok := reCache[key]; ok {
		return re
	}
	escaped := make([]string, len(hosts))
	for i, h := range hosts {
		escaped[i] = regexp.QuoteMeta(strings.ToLower(h))
	}
	// Exact host match (no subdomain wildcard — mirrors reference project).
	// Path allows any non-whitespace / non-delimiter character.
	re := regexp.MustCompile(`(?i)(https?)://(` + strings.Join(escaped, "|") + `)(/[^\s"'<>]*)?`)
	reCache[key] = re
	return re
}

// patchURLsInBody rewrites URLs in body whose host is in webHosts so they
// point at targetScheme://targetHost (path preserved).
// Only operates on text/html/js/json content; binary responses are unchanged.
// URLs already pointing to targetHost are left alone.
func patchURLsInBody(body []byte, contentType, targetScheme, targetHost string, webHosts []string) []byte {
	if len(webHosts) == 0 {
		return body
	}
	ct := strings.ToLower(contentType)
	if !strings.Contains(ct, "json") &&
		!strings.Contains(ct, "html") &&
		!strings.Contains(ct, "javascript") &&
		!strings.Contains(ct, "text") {
		return body
	}
	re := urlREForHosts(webHosts)
	targetLow := strings.ToLower(targetHost)
	return re.ReplaceAllFunc(body, func(match []byte) []byte {
		sub := re.FindSubmatch(match)
		if sub == nil {
			return match
		}
		if strings.ToLower(string(sub[2])) == targetLow {
			return match // already points at target
		}
		return append([]byte(targetScheme+"://"+targetHost), sub[3]...)
	})
}
