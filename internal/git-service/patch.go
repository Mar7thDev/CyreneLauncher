package gitService

import (
	"cyrene-launcher/pkg/constant"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// GetLatestPatchVersion returns the newest tag whose release ships the
// patch DLLs. Walks releases newest-first so launcher-only releases (in the
// same feed) are skipped instead of being mistaken for the latest patch.
func (g *GitService) GetLatestPatchVersion() (bool, string, string) {
	url := constant.March7thHoneyConfig.ReleasesUrl
	if url == "" {
		return false, "", SourceNotConfigured
	}
	// Both OS + CN DLLs are expected to ship together (validate-release
	// workflow enforces it), so checking for one is sufficient.
	tag, ok := g.getLatestReleaseTagWithAsset(url, constant.PatchDllFileOS)
	if !ok {
		return false, "", "no release with " + constant.PatchDllFileOS + " found"
	}
	return true, tag, ""
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
