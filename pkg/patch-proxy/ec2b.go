//go:build windows

package patchproxy

import (
	"bytes"
	"encoding/base64"
	"strings"
)

const ec2bLen = 2076 // size of the raw Ec2b key blob

var ec2bMagic = []byte("Ec2b")

// isGatewayPath reports whether a request path is the dispatch query_gateway
// endpoint, whose response carries the Ec2b key.
func isGatewayPath(path string) bool {
	return strings.Contains(strings.ToLower(path), "query_gateway")
}

// extractEc2b locates the raw Ec2b key blob inside a query_gateway response.
//
// The body is base64(GateServer protobuf); the client_secret_key field is itself
// base64(Ec2b raw bytes). So we decode the outer base64 layer, then find the
// inner blob — either raw ("Ec2b" magic) or base64'd again ("RWMy" = base64 of
// "Ec2b"). No proto field numbers — mirrors the in-process capture in
// CyreneHook.dll. Returns nil when no blob is present.
func extractEc2b(body []byte) []byte {
	for _, outer := range b64Runs(body) {
		if i := bytes.Index(outer, ec2bMagic); i >= 0 && len(outer)-i >= ec2bLen {
			return outer[i : i+ec2bLen]
		}
		for _, inner := range b64Runs(outer) {
			if len(inner) >= ec2bLen && bytes.HasPrefix(inner, ec2bMagic) {
				return inner[:ec2bLen]
			}
		}
	}
	return nil
}

func isB64(b byte) bool {
	return (b >= 'A' && b <= 'Z') || (b >= 'a' && b <= 'z') ||
		(b >= '0' && b <= '9') || b == '+' || b == '/' || b == '='
}

// b64Runs decodes every base64 run of >=256 chars found in data.
func b64Runs(data []byte) [][]byte {
	var out [][]byte
	for i := 0; i < len(data); {
		if !isB64(data[i]) {
			i++
			continue
		}
		j := i
		for j < len(data) && isB64(data[j]) {
			j++
		}
		if j-i >= 256 {
			if dec := tryB64(data[i:j]); dec != nil {
				out = append(out, dec)
			}
		}
		i = j
	}
	return out
}

// tryB64 decodes a base64 run, trimming '=' padding and truncating to a 4-char
// boundary (matching the C# capture). Returns nil on failure.
func tryB64(s []byte) []byte {
	n := len(s)
	for n > 0 && s[n-1] == '=' {
		n--
	}
	n -= n % 4
	if n < 4 {
		return nil
	}
	dec, err := base64.RawStdEncoding.DecodeString(string(s[:n]))
	if err != nil {
		return nil
	}
	return dec
}
