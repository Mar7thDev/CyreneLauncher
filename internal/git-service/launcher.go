package gitService

import (
	"encoding/json"
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/models"
	"io"
	"net/http"
	"github.com/minio/selfupdate"

)

type GitService struct{}


func (g *GitService) GetLatestLauncherVersion() (bool, string, string) {
	resp, err := http.Get(constant.LauncherGitUrl)
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