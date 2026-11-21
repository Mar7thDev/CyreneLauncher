package gitService

import (
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/models"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestOrdinaryReleaseSkipsDraftsAndPrereleases(t *testing.T) {
	const asset = "cyrene-launcher.exe"
	releases := []*models.ReleaseType{
		{TagName: "1.2.0-beta", Prerelease: true, Assets: []models.AssetType{{Name: asset}}},
		{TagName: "1.1.9", Draft: true, Assets: []models.AssetType{{Name: asset}}},
		{TagName: "1.1.8", Assets: []models.AssetType{{Name: "other.zip"}}},
		{TagName: "1.1.7", Assets: []models.AssetType{{Name: asset}}},
	}

	tag, ok := findLatestReleaseTagWithAsset(releases, asset, isOrdinaryRelease)
	if !ok || tag != "1.1.7" {
		t.Fatalf("selected %q (ok=%t), want 1.1.7", tag, ok)
	}
}

func TestHoneyChannelsSelectOnlyTheirOwnReleases(t *testing.T) {
	releases := []*models.ReleaseType{
		{TagName: "prod-1.0.13", Prerelease: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "1.0.15", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "canary-1.0.16", Prerelease: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "1.0.14", Draft: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
	}

	testTag, ok := findLatestReleaseTagWithAsset(releases, constant.HoneyServerAsset, isOrdinaryRelease)
	if !ok || testTag != "1.0.15" {
		t.Fatalf("test channel selected %q (ok=%t), want 1.0.15", testTag, ok)
	}

	prodTag, ok := findLatestReleaseTagWithAsset(releases, constant.HoneyServerAsset, isHoneyProductionRelease)
	if !ok || prodTag != "prod-1.0.13" {
		t.Fatalf("production channel selected %q (ok=%t), want prod-1.0.13", prodTag, ok)
	}
}

func TestHoneyProductionChannelRequiresProdPrerelease(t *testing.T) {
	releases := []*models.ReleaseType{
		{TagName: "1.0.15", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "canary-1.0.16", Prerelease: true, Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
		{TagName: "prod-1.0.14", Assets: []models.AssetType{{Name: constant.HoneyServerAsset}}},
	}

	if tag, ok := findLatestReleaseTagWithAsset(releases, constant.HoneyServerAsset, isHoneyProductionRelease); ok || tag != "" {
		t.Fatalf("production channel selected %q (ok=%t), want no release", tag, ok)
	}
}

func TestDownloadFileParallelRejectsIncompleteAsset(t *testing.T) {
	const payload = "0123456789abcdefghijklmnopqrstuv"
	tests := []struct {
		name     string
		response func(http.ResponseWriter, string, string)
	}{
		{name: "complete"},
		{name: "failed range", response: func(w http.ResponseWriter, _ string, _ string) {
			http.Error(w, "unavailable", http.StatusServiceUnavailable)
		}},
		{name: "truncated range", response: func(w http.ResponseWriter, contentRange, part string) {
			w.Header().Set("Content-Range", contentRange)
			w.WriteHeader(http.StatusPartialContent)
			fmt.Fprint(w, part[:len(part)-1])
		}},
		{name: "wrong range", response: func(w http.ResponseWriter, _ string, part string) {
			w.Header().Set("Content-Range", "bytes 0-7/32")
			w.WriteHeader(http.StatusPartialContent)
			fmt.Fprint(w, part)
		}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method == http.MethodHead {
					w.Header().Set("Content-Length", fmt.Sprint(len(payload)))
					return
				}
				var start, end int
				if _, err := fmt.Sscanf(r.Header.Get("Range"), "bytes=%d-%d", &start, &end); err != nil {
					http.Error(w, "expected byte range", http.StatusBadRequest)
					return
				}
				part := payload[start : end+1]
				contentRange := fmt.Sprintf("bytes %d-%d/%d", start, end, len(payload))
				if start == 8 && tt.response != nil {
					tt.response(w, contentRange, part)
					return
				}
				w.Header().Set("Content-Range", contentRange)
				w.WriteHeader(http.StatusPartialContent)
				fmt.Fprint(w, part)
			}))
			defer server.Close()

			path := filepath.Join(t.TempDir(), "win-x64.zip")
			tmpPath, err := (&GitService{}).downloadFileParallel(path, server.URL, 4, nil)
			if tt.response != nil {
				if err == nil {
					t.Fatal("invalid download reported success")
				}
				if _, err := os.Stat(path + ".tmp"); !os.IsNotExist(err) {
					t.Fatalf("incomplete download still exists: %v", err)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			data, err := os.ReadFile(tmpPath)
			if err != nil || string(data) != payload {
				t.Fatalf("downloaded %q, error %v", data, err)
			}
		})
	}
}
