//go:build windows

package accountService

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestLegacyWebsiteSessionIsNotReused(t *testing.T) {
	root := t.TempDir()
	t.Setenv("AppData", root)
	dir := filepath.Join(root, "CyreneLauncher")
	if err := os.Mkdir(dir, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "account.dat"), []byte("legacy fixture"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadToken(); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected a fresh session on the new website; got %v", err)
	}
}
