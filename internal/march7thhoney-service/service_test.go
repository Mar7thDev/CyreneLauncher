//go:build windows

package march7thhoneyService

import (
	"os"
	"path/filepath"
	"testing"
)

func TestEnsureDLLRefreshesSameSizeFile(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.MkdirAll(filepath.Dir(dllStoragePath), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(dllStoragePath, []byte("old DLL"), 0644); err != nil {
		t.Fatal(err)
	}

	const embeddedDLL = "new DLL"
	service := New([]byte(embeddedDLL), nil)
	path, err := service.ensureDLL()
	if err != nil {
		t.Fatal(err)
	}
	contents, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(contents) != embeddedDLL {
		t.Errorf("extracted DLL = %q, want %q", contents, embeddedDLL)
	}
}
