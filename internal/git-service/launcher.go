package gitService

import (
	"cyrene-launcher/pkg/constant"
	"net/http"

	"github.com/minio/selfupdate"
)

type GitService struct{}


func (g *GitService) GetLatestLauncherVersion() (bool, string, string) {
	tag, ok := g.getLatestReleaseTagWithAsset(constant.LauncherGitUrl, constant.LauncherFile)
	if !ok {
		return false, "", "no release with " + constant.LauncherFile + " found"
	}
	return true, tag, ""
}



func (g *GitService) UpdateLauncherProgress(version string) (bool, string) {
	asset, ok := g.getReleaseAsset(version, constant.LauncherGitUrl, constant.LauncherFile)
	if !ok {
		return false, "no release found"
	}

	resp, err := http.Get(asset.BrowserDownloadURL)
	if err != nil {
		return false, err.Error()
	}
	defer resp.Body.Close()

	err = selfupdate.Apply(resp.Body, selfupdate.Options{})
	if err != nil {
		return false, err.Error()
	}
	return true, ""
}