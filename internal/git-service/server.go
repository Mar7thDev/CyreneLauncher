package gitService

import (
	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/models"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/net/html"
)

// SourceNotConfigured is returned when the user picked a source whose URL is empty.
const SourceNotConfigured = "SOURCE_NOT_CONFIGURED"

var lastServerArchivePath string
var lastServerArchiveSource string

func (g *GitService) GetLatestServerVersion(source string) (bool, string, string) {
	if source == constant.SourceGenshin {
		asset, ok, err := g.getGenshinRuntimeAsset("")
		if err != nil {
			return false, "", err.Error()
		}
		if !ok {
			return false, "", "no Columbina-GI launcher runtime package found"
		}
		return true, asset.Name, ""
	}

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
	storageDir := constant.ServerStorageUrl
	var asset models.AssetType
	var downloadURL string

	if source == constant.SourceGenshin {
		resolvedAsset, ok, err := g.getGenshinRuntimeAsset(version)
		if err != nil {
			return false, err.Error()
		}
		if !ok {
			return false, "no Columbina-GI launcher runtime package found"
		}
		asset = resolvedAsset
		downloadURL = asset.BrowserDownloadURL
		if downloadURL == "" {
			downloadURL = fmt.Sprintf(
				"https://github.com/PrliStrxs/ZGN-SR/releases/download/%s/%s",
				constant.GenshinServerReleaseTag,
				asset.Name,
			)
		}
		storageDir = constant.GenshinServerStorageUrl
	} else {
		cfg := constant.GetSourceConfig(source)
		if cfg.ServerGitUrl == "" {
			return false, SourceNotConfigured
		}

		resolvedAsset, ok := g.getReleaseAsset(version, cfg.ServerGitUrl, cfg.ServerZipFile)
		if !ok {
			return false, "no release found"
		}
		asset = resolvedAsset
		downloadURL = asset.BrowserDownloadURL
	}

	if err := os.MkdirAll(storageDir, 0755); err != nil {
		return false, err.Error()
	}

	saveFile := filepath.Join(storageDir, asset.Name)
	os.Remove(saveFile)
	os.Remove(saveFile + ".tmp")

	tmpPath, err := g.downloadFileParallel(saveFile, downloadURL, 4, func(percent float64, speed string) {
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
			lastServerArchivePath = saveFile
			lastServerArchiveSource = source
			return true, ""
		}
		time.Sleep(300 * time.Millisecond)
	}
	return false, "failed to rename tmp file after retries"
}

func (g *GitService) UnzipServer() {
	archivePath := lastServerArchivePath
	source := lastServerArchiveSource

	if source == constant.SourceGenshin {
		if archivePath == "" {
			return
		}
		os.RemoveAll(constant.GenshinServerBundleDir)
		if err := g.unzipParallel(archivePath, constant.GenshinServerStorageUrl); err == nil {
			os.Remove(archivePath)
		}
		return
	}

	if archivePath == "" {
		archivePath = filepath.Join(constant.ServerStorageUrl, constant.ServerZipFile)
	}
	if err := g.unzipParallel(archivePath, constant.ServerStorageUrl); err == nil {
		os.Remove(archivePath)
	}
}

func (g *GitService) getGenshinRuntimeAsset(assetName string) (models.AssetType, bool, error) {
	resp, err := http.Get(constant.GenshinServerGitUrl)
	if err != nil {
		return g.getGenshinRuntimeAssetFromReleasePage(assetName, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return g.getGenshinRuntimeAssetFromReleasePage(assetName, fmt.Errorf("GitHub releases API returned %s", resp.Status))
	}

	body, _ := io.ReadAll(resp.Body)

	var releases []*models.ReleaseType
	if err := json.Unmarshal(body, &releases); err != nil {
		return g.getGenshinRuntimeAssetFromReleasePage(assetName, err)
	}

	var latest models.AssetType
	found := false
	for _, release := range releases {
		if release.TagName != constant.GenshinServerReleaseTag || release.Draft {
			continue
		}
		for _, asset := range release.Assets {
			if assetName != "" {
				if asset.Name == assetName {
					return asset, true, nil
				}
				continue
			}
			if !strings.HasPrefix(asset.Name, constant.GenshinServerAssetPrefix) ||
				!strings.HasSuffix(asset.Name, constant.GenshinServerAssetSuffix) {
				continue
			}
			if !found || asset.Name > latest.Name {
				latest = asset
				found = true
			}
		}
	}

	if found {
		return latest, true, nil
	}
	return g.getGenshinRuntimeAssetFromReleasePage(assetName, nil)
}

func (g *GitService) getGenshinRuntimeAssetFromReleasePage(assetName string, apiErr error) (models.AssetType, bool, error) {
	resp, err := http.Get(constant.GenshinServerExpandedAssetsUrl)
	if err != nil {
		if apiErr != nil {
			return models.AssetType{}, false, apiErr
		}
		return models.AssetType{}, false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		if apiErr != nil {
			return models.AssetType{}, false, apiErr
		}
		return models.AssetType{}, false, fmt.Errorf("GitHub release assets page returned %s", resp.Status)
	}

	doc, err := html.Parse(resp.Body)
	if err != nil {
		if apiErr != nil {
			return models.AssetType{}, false, apiErr
		}
		return models.AssetType{}, false, err
	}

	var latest models.AssetType
	found := false
	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, attr := range n.Attr {
				if attr.Key != "href" {
					continue
				}
				name, downloadURL, ok := parseGenshinRuntimeAssetHref(attr.Val)
				if !ok {
					continue
				}
				if assetName != "" {
					if name == assetName {
						latest = models.AssetType{Name: name, BrowserDownloadURL: downloadURL}
						found = true
					}
					continue
				}
				if !found || name > latest.Name {
					latest = models.AssetType{Name: name, BrowserDownloadURL: downloadURL}
					found = true
				}
			}
		}
		for child := n.FirstChild; child != nil; child = child.NextSibling {
			walk(child)
		}
	}
	walk(doc)

	return latest, found, nil
}

func parseGenshinRuntimeAssetHref(href string) (string, string, bool) {
	if !strings.Contains(href, "/releases/download/"+constant.GenshinServerReleaseTag+"/") {
		return "", "", false
	}

	parsed, err := url.Parse(href)
	if err != nil {
		return "", "", false
	}
	name, err := url.PathUnescape(path.Base(parsed.Path))
	if err != nil {
		return "", "", false
	}
	if !strings.HasPrefix(name, constant.GenshinServerAssetPrefix) ||
		!strings.HasSuffix(name, constant.GenshinServerAssetSuffix) {
		return "", "", false
	}

	downloadURL := href
	if strings.HasPrefix(downloadURL, "/") {
		downloadURL = "https://github.com" + downloadURL
	}
	return name, downloadURL, true
}
