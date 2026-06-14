package buildconfig

import (
	"bytes"
	"embed"
	"encoding/json"
	"os"
	"strings"
	"sync"
)

//go:embed *.json
var configFiles embed.FS

type LocalConfig struct {
	LauncherAppName           string `json:"launcher_app_name"`
	LauncherVersion           string `json:"launcher_version"`
	LauncherUpdateRepo        string `json:"launcher_update_repo"`
	LauncherUpdateReleasesURL string `json:"launcher_update_releases_url"`
	LauncherUpdateAssetName   string `json:"launcher_update_asset_name"`
}

var (
	localConfigOnce sync.Once
	localConfig     LocalConfig
)

func Local() LocalConfig {
	localConfigOnce.Do(func() {
		data, err := configFiles.ReadFile("local.json")
		if err != nil {
			return
		}
		data = bytes.TrimPrefix(data, []byte{0xEF, 0xBB, 0xBF})
		_ = json.Unmarshal(data, &localConfig)
	})
	return localConfig
}

func FirstValue(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func LauncherVersion(fallback string) string {
	local := Local()
	return FirstValue(os.Getenv("LAUNCHER_VERSION"), local.LauncherVersion, fallback)
}

func LauncherAppName(fallback string) string {
	local := Local()
	return FirstValue(os.Getenv("VITE_LAUNCHER_APP_NAME"), os.Getenv("LAUNCHER_BUILD_APP_NAME"), local.LauncherAppName, fallback)
}
