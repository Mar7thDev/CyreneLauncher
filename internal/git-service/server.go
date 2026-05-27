package gitService

import (
	"encoding/json"
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/models"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// SourceNotConfigured is returned when the user picked a source whose URL is empty.
const SourceNotConfigured = "SOURCE_NOT_CONFIGURED"

func (g *GitService) GetLatestServerVersion(source string) (bool, string, string) {
	cfg := constant.GetSourceConfig(source)
	if cfg.ServerGitUrl == "" {
		return false, "", SourceNotConfigured
	}

	resp, err := http.Get(cfg.ServerGitUrl)
	if err != nil {
		return false, "", err.Error()
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var releases []models.ReleaseType
	err = json.Unmarshal(body, &releases)
	if err != nil {
		return false, "", err.Error()
	}

	if len(releases) == 0 {
		return false, "", "no releases found"
	}

	return true, releases[0].TagName, ""
}

func (g *GitService) DownloadServerProgress(source string, version string) (bool, string) {
	cfg := constant.GetSourceConfig(source)
	if cfg.ServerGitUrl == "" {
		return false, SourceNotConfigured
	}

	asset, ok := g.getReleaseAsset(version, cfg.ServerGitUrl, cfg.ServerZipFile)
	if !ok {
		return false, "no release found"
	}

	if err := os.MkdirAll(constant.ServerStorageUrl, 0755); err != nil {
		return false, err.Error()
	}

	saveFile := filepath.Join(constant.ServerStorageUrl, asset.Name)
	tmpPath, err := g.downloadFileParallel(saveFile, asset.BrowserDownloadURL, 4, func(percent float64, speed string) {
		application.Get().Event.Emit("download:server", map[string]interface{}{
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

func (g *GitService) UnzipServer() {
	g.unzipParallel(filepath.Join(constant.ServerStorageUrl, constant.ServerZipFile), constant.ServerStorageUrl)
	os.Remove(filepath.Join(constant.ServerStorageUrl, constant.ServerZipFile))
}
