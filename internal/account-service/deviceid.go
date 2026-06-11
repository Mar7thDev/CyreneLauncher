//go:build windows

package accountService

import (
	"crypto/sha256"
	"encoding/hex"
	"os"

	"golang.org/x/sys/windows/registry"
)

// deviceID returns a stable, privacy-preserving machine fingerprint: the
// SHA-256 of the Windows MachineGuid (falling back to the hostname). Only the
// hash ever leaves the machine.
func deviceID() string {
	source := ""
	k, err := registry.OpenKey(registry.LOCAL_MACHINE, `SOFTWARE\Microsoft\Cryptography`, registry.QUERY_VALUE|registry.WOW64_64KEY)
	if err == nil {
		if guid, _, err := k.GetStringValue("MachineGuid"); err == nil {
			source = guid
		}
		k.Close()
	}
	if source == "" {
		source, _ = os.Hostname()
	}
	if source == "" {
		return ""
	}
	sum := sha256.Sum256([]byte("cyrene-device:" + source))
	return hex.EncodeToString(sum[:])
}
