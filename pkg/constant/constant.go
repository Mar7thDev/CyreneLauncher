package constant

const AppName = "Cyrene Launcher"

// === Launcher self-update ===
// Update detection reads releases from the main repo (open-sourced).
const LauncherGitUrl = "https://api.github.com/repos/Mar7thDev/CyreneLauncher/releases"
const LauncherFile = "cyrene-launcher.exe"

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

// HoyoToonTargetURL is the upstream community server ("HoyoToon (Online)").
const HoyoToonTargetURL = "https://march7th.hoyotoon.com"

// KunPSTargetURL is the KunPS channel server ("KunPS (Online)"). This build is
// the KunPS channel edition, so it is also the default target.
const KunPSTargetURL = "http://210.16.175.19:520"

const DefaultPatchTargetURL = KunPSTargetURL

// SourceGenshin is the downloadable Genshin server package source.
const SourceGenshin = "genshin"

// March7thHoney local-server channels use separate on-disk deployments.
const (
	LocalServerTestDir  = "./server"
	LocalServerTestExe  = "./server/March7thHoney.exe"
	LocalServerProdDir  = "./server_prod"
	LocalServerProdExe  = "./server_prod/March7thHoney.exe"
	LocalServerTestMode = "test"
	LocalServerProdMode = "prod"
)

const LocalServerImageName = "March7thHoney.exe"
const LocalServerProbeAddr = "127.0.0.1:21000"
const LocalServerTargetURL = "http://127.0.0.1:21000"

// March7thHoney test uses ordinary releases and production uses prod-* prereleases.
const SourceHoneyTest = "honey_test"
const SourceHoneyProd = "honey_prod"
const HoneyServerGitUrl = "https://api.github.com/repos/Mar7thLover/March7thHoney-Public/releases"
const HoneyServerAsset = "win-x64.zip"
const HoneyServerProdTagPrefix = "prod-"

const CurrentLauncherVersion = "1.1.2"

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

// WebBaseURL is the Cyrene website (account system, news, device login).
const WebBaseURL = "https://cyrene.hoyotoon.com"

// AnnouncementUrl returns the website's server announcements as a JSON
// []NewsItem array (pinned first). Each entry becomes one card in the News
// page's "Server" tab. Empty string disables the tab.
const AnnouncementUrl = WebBaseURL + "/api/launcher/news"

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
