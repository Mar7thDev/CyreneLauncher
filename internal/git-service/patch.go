package gitService

import (
	"encoding/json"
	"firefly-launcher/pkg/constant"
	"firefly-launcher/pkg/models"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// GetLatestPatchVersion returns the newest tag of the March7thHoney patch DLL
// from its configured GitHub release feed. The response schema matches Gitea,
// so the rest of the download pipeline is unchanged.
func (g *GitService) GetLatestPatchVersion() (bool, string, string) {
	url := constant.March7thHoneyConfig.ReleasesUrl
	if url == "" {
		return false, "", SourceNotConfigured
	}

	resp, err := http.Get(url)
	if err != nil {
		return false, "", err.Error()
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var releases []models.ReleaseType
	if err := json.Unmarshal(body, &releases); err != nil {
		return false, "", err.Error()
	}
	if len(releases) == 0 {
		return false, "", "no releases found"
	}
	return true, releases[0].TagName, ""
}

// DownloadPatchProgress fetches the region-specific patch DLL asset for the
// given version into constant.PatchStorageUrl, emitting "download:patch"
// events as it streams.
//
// region must be "os" or "cn"; anything else is treated as OS.
func (g *GitService) DownloadPatchProgress(region, version string) (bool, string) {
	cfg := constant.March7thHoneyConfig
	if cfg.ReleasesUrl == "" {
		return false, SourceNotConfigured
	}

	assetName := cfg.AssetFor(region)
	asset, ok := g.getReleaseAsset(version, cfg.ReleasesUrl, assetName)
	if !ok {
		return false, fmt.Sprintf("release asset %q not found", assetName)
	}

	if err := os.MkdirAll(constant.PatchStorageUrl, 0755); err != nil {
		return false, err.Error()
	}

	saveFile := filepath.Join(constant.PatchStorageUrl, asset.Name)
	tmpPath, err := g.downloadFileParallel(saveFile, asset.BrowserDownloadURL, 4, func(percent float64, speed string) {
		application.Get().Event.Emit("download:patch", map[string]interface{}{
			"percent": fmt.Sprintf("%.2f", percent),
			"speed":   speed,
		})
	})
	if err != nil {
		return false, err.Error()
	}
	for i := 0; i < 3; i++ {
		if err := os.Rename(tmpPath, saveFile); err == nil {
			return true, ""
		}
		time.Sleep(300 * time.Millisecond)
	}
	return false, "failed to rename tmp file after retries"
}
