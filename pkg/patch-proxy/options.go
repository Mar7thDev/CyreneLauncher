//go:build windows

package patchproxy

import "strings"

// DefaultRSAKey is the RSA public key from the reference project (HSR-Patch /
// march7th.hoyotoon.com). Used when RSAPatch is enabled and no custom key is set.
const DefaultRSAKey = `<RSAKeyValue><Exponent>AQAB</Exponent><Modulus>qb76pH8/rX3p3+GDjfs8ZUGtBbQk7DJ5PdT1FIDL2UKbFQ4aorPmuPKA7qVEspV5XsLil6Ii+FzxrQuemgpuikzzjRUwklGy7iv1QcDIuB+b4+qQcecNGROT32ACgnIiKbrzAedehP9TbfNyXpGuaWIaWRVyvliktrb3td78/ljB+UJvrXOLkky5YopWdUn1kp4LQ70KsjbG5ocjMyIGk+RdmmgNJRduEIaT//gPNKH2TjPABaaEPb8FgCgTQ2yimt8NsxZzH8ZpmQzFievyU5Nlz4KxlvRypQbwNe0paQ7pOefhLSJ9NEanxqyzajgildVtf9ozftRnXiNy+EQ3CQ==</Modulus></RSAKeyValue>`

// DefaultWebHosts is the WebRedirectHosts list from the reference project.
// URL rewriting in response bodies is applied to these exact hostnames only.
var DefaultWebHosts = []string{
	"account.hoyoverse.com",
	"user.hoyoverse.com",
	"sdk.hoyoverse.com",
	"webstatic.hoyoverse.com",
	"webstatic-sea.hoyoverse.com",
	"hkrpg-sdk-os-static.hoyoverse.com",
	"sdk-os-static.hoyoverse.com",
}

// PatchOptions controls the optional patching features of the MITM proxy.
// Zero value disables all patching; callers should use DefaultPatchOptions()
// to get the recommended defaults.
type PatchOptions struct {
	// RSAPatch enables replacement of RSA public key values in JSON/text responses.
	RSAPatch bool `json:"rsaPatch"`
	// RSAKey overrides the injected RSA key. Empty → DefaultRSAKey.
	RSAKey string `json:"rsaKey"`
	// WebRedirect enables URL rewriting in text/html/json/js responses.
	WebRedirect bool `json:"webRedirect"`
	// WebHosts is a comma- or newline-separated list of exact hostnames whose
	// URLs are rewritten. Empty → DefaultWebHosts.
	WebHosts string `json:"webHosts"`
}

// DefaultPatchOptions returns the recommended settings matching the reference project.
func DefaultPatchOptions() PatchOptions {
	return PatchOptions{RSAPatch: true, WebRedirect: true}
}

// ResolvedRSAKey returns the effective RSA key for body patching.
func (o PatchOptions) ResolvedRSAKey() string {
	if o.RSAKey != "" {
		return o.RSAKey
	}
	return DefaultRSAKey
}

// ResolvedWebHosts returns the effective host list for URL rewriting.
func (o PatchOptions) ResolvedWebHosts() []string {
	if o.WebHosts == "" {
		return DefaultWebHosts
	}
	parts := strings.FieldsFunc(o.WebHosts, func(r rune) bool {
		return r == ',' || r == '\n' || r == '\r'
	})
	out := make([]string, 0, len(parts))
	for _, h := range parts {
		if h = strings.TrimSpace(h); h != "" {
			out = append(out, strings.ToLower(h))
		}
	}
	return out
}
