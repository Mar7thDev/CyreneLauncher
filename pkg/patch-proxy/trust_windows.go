//go:build windows

package patchproxy

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// InstallTrust adds the proxy root CA certificate to the Windows trusted root
// store so the game accepts our MITM TLS certificates.
// Safe to call multiple times — certutil is idempotent for the same thumbprint.
func (ca *caState) InstallTrust() error {
	absPath, err := filepath.Abs(caCertFile)
	if err != nil {
		return err
	}
	// Ensure the cert file is on disk (it should already be from getCA, but
	// write it again to be safe).
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		if err := os.MkdirAll(filepath.Dir(absPath), 0755); err != nil {
			return err
		}
		if err := os.WriteFile(absPath, ca.certPEM, 0644); err != nil {
			return err
		}
	}
	// Try machine store first (requires admin, which the launcher typically has).
	if err := exec.Command("certutil", "-addstore", "Root", absPath).Run(); err == nil {
		return nil
	}
	// Fallback to current-user store.
	out, err := exec.Command("certutil", "-addstore", "-user", "Root", absPath).CombinedOutput()
	if err != nil {
		return fmt.Errorf("certutil: %s", out)
	}
	return nil
}
