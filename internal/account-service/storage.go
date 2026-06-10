//go:build windows

package accountService

import (
	"os"
	"path/filepath"

	"github.com/billgraziano/dpapi"
)

// The token is DPAPI-encrypted with the current Windows user's credentials,
// so copying account.dat to another machine or account yields nothing.
func tokenPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "CyreneLauncher", "account.dat"), nil
}

func saveToken(token string) error {
	path, err := tokenPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	encrypted, err := dpapi.EncryptBytes([]byte(token))
	if err != nil {
		return err
	}
	return os.WriteFile(path, encrypted, 0600)
}

func loadToken() (string, error) {
	path, err := tokenPath()
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	decrypted, err := dpapi.DecryptBytes(data)
	if err != nil {
		return "", err
	}
	return string(decrypted), nil
}

func clearToken() {
	if path, err := tokenPath(); err == nil {
		os.Remove(path)
	}
}
