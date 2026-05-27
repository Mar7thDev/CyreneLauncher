package verifier

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"cyrene-launcher/pkg/models"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type Verifier struct {
	GamePath       string
	HdiffPath      string
	DiffMapEntries []*models.DiffMapType
}

func NewVerifier(gamePath, hdiffPath string) (*Verifier, error) {
	data, err := os.ReadFile(hdiffPath + "/hdiffmap.json")
	if err != nil {
		return nil, err
	}

	var jsonData struct {
		DiffMap []*models.DiffMapType `json:"diff_map"`
	}
	if err := json.Unmarshal(data, &jsonData); err != nil {
		return nil, err
	}

	return &Verifier{
		GamePath:       gamePath,
		HdiffPath:      hdiffPath,
		DiffMapEntries: jsonData.DiffMap,
	}, nil
}

func (v *Verifier) VerifyAll() error {
	for i, entry := range v.DiffMapEntries {
		application.Get().Event.Emit(
			"hdiffz:progress", map[string]int{
				"progress":    i,
				"maxProgress": len(v.DiffMapEntries),
			})
		if err := check(entry.SourceFileName, entry.SourceFileSize, entry.SourceFileMD5, v.GamePath); err != nil {
			application.Get().Event.Emit("hdiffz:error", err.Error())
			continue
		}
	}
	return nil
}

func check(relPath string, expectedSize int64, expectedMD5, base string) error {
	fullPath := filepath.Join(base, relPath)

	info, err := os.Stat(fullPath)
	if err != nil {
		return fmt.Errorf("file not found: %s", fullPath)
	}

	if info.Size() != expectedSize {
		return fmt.Errorf("file size mismatch for %s: expected %d, got %d",
			fullPath, expectedSize, info.Size())
	}

	md5Hash, err := FileMD5(fullPath)
	if err != nil {
		return fmt.Errorf("error reading %s: %w", fullPath, err)
	}

	if md5Hash != expectedMD5 {
		return fmt.Errorf("md5 mismatch for %s: expected %s, got %s",
			fullPath, expectedMD5, md5Hash)
	}

	return nil
}

func FileMD5(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := md5.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}
