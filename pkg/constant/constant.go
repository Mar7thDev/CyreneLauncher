package constant

const AppName = "Cyrene Launcher"

// === Launcher self-update ===
const LauncherGitUrl = "https://api.github.com/repos/Mar7thLover/CyreneLauncher-Public/releases"
const LauncherFile = "cyrene-launcher.exe"

// === Server/Proxy storage ===
const ServerStorageUrl = "./server"
const ProxyStorageUrl = "./proxy"
const ServerZipFile = "prebuild_win_x86.zip"
const ProxyFile = "firefly-go-proxy.exe"
const TempUrl = "./temp"

// === Genshin launcher-runtime package ===
const GenshinServerGitUrl = "https://api.github.com/repos/PrliStrxs/ZGN-SR/releases"
const GenshinServerExpandedAssetsUrl = "https://github.com/PrliStrxs/ZGN-SR/releases/expanded_assets/genshin"
const GenshinServerReleaseTag = "genshin"
const GenshinServerAssetPrefix = "Columbina-GI-Release-launcher-runtime-"
const GenshinServerAssetSuffix = ".zip"
const GenshinServerStorageUrl = "./server-packages"
const GenshinServerBundleDir = "./server-packages/Columbina-GI"
const GenshinServerManifest = "./server-packages/Columbina-GI/cyrene-manifest.json"

// === March7thHoney proxy mode ===
//
// The patch is implemented as a Go-native HTTPS MITM proxy (pkg/patch-proxy).
// No DLL download or injection is required. The proxy intercepts miHoYo-domain
// traffic and forwards it to DefaultPatchTargetURL (or a user-configured URL).
const DefaultPatchTargetURL = "https://march7th.hoyotoon.com"

// === Server source modes ===
//
// The launcher supports switching between download sources for the server +
// proxy artifacts. Users pick one in Settings. All URLs are hard-coded here
// (no user-side override yet — interface kept open for future).
const (
	SourceFirefly = "firefly"
	SourceCustom  = "custom"
	SourceGenshin = "genshin"
)

// SourceConfig is the per-source URL + filename bundle.
// Empty URLs are treated by GitService as "not configured".
//
// Both Gitea and GitHub releases APIs return the same JSON shape
// (tag_name, assets[].browser_download_url, assets[].name), so the same
// SourceConfig + downloader code works for either backend.
type SourceConfig struct {
	Name          string // for logging
	ServerGitUrl  string
	ProxyGitUrl   string
	ServerZipFile string // release asset filename
	ProxyFile     string // release asset filename
}

// FireflyGo public Gitea source — the launcher's default.
var FireflyConfig = SourceConfig{
	Name:          "FireflyGo",
	ServerGitUrl:  "https://git.kain.io.vn/api/v1/repos/Firefly-Shelter/FireflyGo_Local_Archive/releases",
	ProxyGitUrl:   "https://git.kain.io.vn/api/v1/repos/Firefly-Shelter/FireflyGo_Proxy/releases",
	ServerZipFile: ServerZipFile,
	ProxyFile:     ProxyFile,
}

// Custom (user-hosted) source — currently a placeholder.
// Replace these URLs with your own Gitea releases feeds.
var CustomConfig = SourceConfig{
	Name:          "Custom",
	ServerGitUrl:  "", // TODO: fill in your server releases URL
	ProxyGitUrl:   "", // TODO: fill in your proxy releases URL
	ServerZipFile: ServerZipFile,
	ProxyFile:     ProxyFile,
}

// GetSourceConfig returns the config for the named source, falling back to
// FireflyGo when the name is empty or unknown.
func GetSourceConfig(name string) SourceConfig {
	switch name {
	case SourceCustom:
		return CustomConfig
	case SourceGenshin:
		return SourceConfig{
			Name:         "Columbina-GI",
			ServerGitUrl: GenshinServerGitUrl,
		}
	default:
		return FireflyConfig
	}
}

// Legacy constants (used only by launcher self-update and fireflygo source).
const ProxyGitUrl = "https://git.kain.io.vn/api/v1/repos/Firefly-Shelter/FireflyGo_Proxy/releases"
const ServerGitUrl = "https://git.kain.io.vn/api/v1/repos/Firefly-Shelter/FireflyGo_Local_Archive/releases"

const CurrentLauncherVersion = "1.0.1"

// === News module ===
//
// HoYoPlay (HYP) Game Content API — the current source the official Star Rail launcher uses.
// Returns banners + posts (公告/活动/资讯). Supports language codes: en-us, zh-cn, zh-tw,
// ja-jp, ko-kr, ru-ru, vi-vn, th-th, id-id, de-de, fr-fr, pt-pt, es-es.
//
// Note: the legacy hkrpg-launcher-static.hoyoverse.com endpoint still resolves but only
// returns social-media icons now — posts/banners moved to HYP.
const (
	HSRLauncherContentURL = "https://sg-hyp-api.hoyoverse.com/hyp/hyp-connect/api/getGameContent"
	HSRLauncherID         = "VYTpXlbWo8" // HoYoPlay global launcher
	HSRGameID             = "4ziysqXOQ8" // Honkai: Star Rail (global)
)

// AnnouncementUrl is the GitHub Contents API endpoint listing markdown files
// in the public repo's announcements/ directory. Each *.md becomes one card
// in the News page's "Server" tab. Filenames are expected to start with
// YYYY-MM-DD so they sort newest-first.
//
// Empty string disables the tab.
const AnnouncementUrl = "https://api.github.com/repos/Mar7thLover/CyreneLauncher-Public/contents/announcements"

// Project metadata for the About section
const ProjectName = "Cyrene Launcher"
const ProjectAuthor = "Firefly Shelter (original) · Cyrene (fork)"
const ProjectRepoUrl = "https://github.com/Mar7thDev/CyreneLauncher"

type ToolFile string

const (
	Tool7zaExe     ToolFile = "bin/7za.exe"
	Tool7zaDLL     ToolFile = "bin/7za.dll"
	Tool7zxaDLL    ToolFile = "bin/7zxa.dll"
	ToolHPatchzExe ToolFile = "bin/hpatchz.exe"
)

var RequiredFiles = map[ToolFile]string{
	Tool7zaExe:     "assets/7za.exe",
	Tool7zaDLL:     "assets/7za.dll",
	Tool7zxaDLL:    "assets/7zxa.dll",
	ToolHPatchzExe: "assets/hpatchz.exe",
}

func (t ToolFile) GetEmbedPath() string {
	return RequiredFiles[t]
}

func (t ToolFile) String() string {
	return string(t)
}
