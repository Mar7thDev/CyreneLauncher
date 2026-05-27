package constant

const AppName = "Cyrene Launcher"

// === Launcher self-update (always FireflyGo source) ===
const LauncherGitUrl = "https://git.kain.io.vn/api/v1/repos/Firefly-Shelter/Firefly_Launcher/releases"
const LauncherFile = "cyrene-launcher.exe"

// === Server/Proxy storage ===
const ServerStorageUrl = "./server"
const ProxyStorageUrl = "./proxy"
const ServerZipFile = "prebuild_win_x86.zip"
const ProxyFile = "firefly-go-proxy.exe"
const TempUrl = "./temp"

// === March7thHoney patch DLL storage ===
//
// The patch DLL is region-specific (RVAs differ between OS / CN builds of
// StarRail). Cyrene downloads each region into its own filename so switching
// regions doesn't clobber the other build.
const PatchStorageUrl = "./patch"
const PatchDllFileOS = "Astrolabe_OS.dll"
const PatchDllFileCN = "Astrolabe_CN.dll"

// PatchDllFileFor returns the on-disk DLL name for a given region. Unknown
// regions fall back to the OS build — callers should ensure region is set
// before reaching here.
func PatchDllFileFor(region string) string {
	if region == "cn" {
		return PatchDllFileCN
	}
	return PatchDllFileOS
}

// === Server source modes ===
//
// The launcher supports switching between download sources for the server +
// proxy artifacts. Users pick one in Settings. All URLs are hard-coded here
// (no user-side override yet — interface kept open for future).
const (
	SourceFirefly = "firefly"
	SourceCustom  = "custom"
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
	default:
		return FireflyConfig
	}
}

// === March7thHoney patch source ===
//
// March7thHoney distributes only the Astrolabe.dll (NativeAOT-compiled patch)
// via GitHub Releases. The launcher itself does the DLL injection — see
// pkg/march7thhoney. No bundled .NET launcher / proxy is needed.
//
// Each release is expected to ship two assets named exactly:
//   - Astrolabe_OS.dll  (Global / HoYoPlay builds)
//   - Astrolabe_CN.dll  (国服 / miHoYo Launcher builds)
type PatchSourceConfig struct {
	Name        string
	ReleasesUrl string // GitHub /releases endpoint (list, newest first)
	AssetFileOS string
	AssetFileCN string
}

// AssetFor returns the release asset filename for the given region, mirroring
// PatchDllFileFor.
func (c PatchSourceConfig) AssetFor(region string) string {
	if region == "cn" {
		return c.AssetFileCN
	}
	return c.AssetFileOS
}

// March7thHoneyConfig points to the public Cyrene patch DLL repo.
var March7thHoneyConfig = PatchSourceConfig{
	Name:        "March7thHoney",
	ReleasesUrl: "https://api.github.com/repos/Mar7thLover/CyreneLauncher-Public/releases",
	AssetFileOS: PatchDllFileOS,
	AssetFileCN: PatchDllFileCN,
}

// Legacy constants for backward compatibility (used only by launcher self-update).
const ProxyGitUrl = "https://git.kain.io.vn/api/v1/repos/Firefly-Shelter/FireflyGo_Proxy/releases"
const ServerGitUrl = "https://git.kain.io.vn/api/v1/repos/Firefly-Shelter/FireflyGo_Local_Archive/releases"

const CurrentLauncherVersion = "2.5.1"

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
const ProjectRepoUrl = "https://git.kain.io.vn/Firefly-Shelter/Firefly_Launcher"

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
