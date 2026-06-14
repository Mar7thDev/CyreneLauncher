package gitService

import (
	"net/http"
	"os"
	"strings"

	"cyrene-launcher/internal/buildconfig"
	"cyrene-launcher/pkg/constant"

	"github.com/minio/selfupdate"
)

type GitService struct{}

type launcherUpdateConfig struct {
	ReleasesURL string
	AssetName   string
}

func firstValue(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func githubReleasesURL(repo string) string {
	repo = strings.Trim(strings.TrimSpace(repo), "/")
	if repo == "" {
		return ""
	}
	return "https://api.github.com/repos/" + repo + "/releases"
}

func getLauncherUpdateConfig() launcherUpdateConfig {
	local := buildconfig.Local()
	repoURL := githubReleasesURL(firstValue(os.Getenv("LAUNCHER_UPDATE_REPO"), local.LauncherUpdateRepo))
	return launcherUpdateConfig{
		ReleasesURL: firstValue(os.Getenv("LAUNCHER_UPDATE_RELEASES_URL"), local.LauncherUpdateReleasesURL, repoURL, constant.LauncherGitUrl),
		AssetName:   firstValue(os.Getenv("LAUNCHER_UPDATE_ASSET_NAME"), local.LauncherUpdateAssetName, constant.LauncherFile),
	}
}

func (g *GitService) GetLatestLauncherVersion() (bool, string, string) {
	config := getLauncherUpdateConfig()
	tag, ok := g.getLatestReleaseTagWithAsset(config.ReleasesURL, config.AssetName)
	if !ok {
		return false, "", "no release with " + config.AssetName + " found"
	}
	return true, tag, ""
}

func (g *GitService) UpdateLauncherProgress(version string) (bool, string) {
	config := getLauncherUpdateConfig()
	asset, ok := g.getReleaseAsset(version, config.ReleasesURL, config.AssetName)
	if !ok {
		return false, "no release found"
	}
	return g.applyLauncherUpdate(asset.BrowserDownloadURL)
}

func (g *GitService) applyLauncherUpdate(downloadURL string) (bool, string) {
	if downloadURL == "" {
		return false, "launcher update download URL is empty"
	}

	resp, err := http.Get(downloadURL)
	if err != nil {
		return false, err.Error()
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false, resp.Status
	}

	err = selfupdate.Apply(resp.Body, selfupdate.Options{})
	if err != nil {
		if rollbackErr := selfupdate.RollbackError(err); rollbackErr != nil {
			return false, err.Error() + ": rollback failed: " + rollbackErr.Error()
		}
		return false, err.Error()
	}
	return true, ""
}
