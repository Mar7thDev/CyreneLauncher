# 🚀 Cyrene Launcher

**English** | [简体中文](README.zh-CN.md)

A lightweight and modern launcher for Anime game — designed to make launching, updating, and customizing your game easy and efficient.

---

## ✨ Features

- 🔄 Automatically update Firefly Go and proxy tools on launch
- 🎮 Launch the game with correct parameters and environment
- 🌐 Switch in-game language (EN, JP, CN, KR) via Language Tools
- 📦 Apply game patches using Hdiffz Tool (HDiffPatch-based)

---

## 🧑‍💻 About the Developer

Hi! We are **Mar7thDev**, a developer team passionate about building simple and powerful tools.  
Cyrene Launcher is built with:

- ⚙️ **Go + Wails** for backend/frontend integration  
- 🎨 **Tailwind CSS** + **DaisyUI** for a clean, responsive UI

My goal is to create tools that are fast, efficient, and enjoyable to use.

---

## 📦 Installation

You can choose between:

- ✅ **Portable** version (no install needed)
- 🛠️ **MSI Installer** (for full integration)

---

## 🛠️ Common Development Commands (Wails v3)

```bash
# Start the app in development mode (hot reload frontend)
wails3 dev

# Build the application (production binary)
wails3 build

# Package the app (NSIS)
wails3 package
```
---

## 🎛️ Local Customization

Shared feature defaults live in `frontend/src/config/features.ts`.
Shared launcher skin defaults live in `frontend/src/config/launcher.ts`.

For personal-only changes, copy `.env.local.example` to `.env.local` in the project root and disable features there:

```bash
VITE_FEATURE_NEWS=false
VITE_FEATURE_ACCOUNT=false
VITE_FEATURE_CONSOLE=false
VITE_FEATURE_HOME_LINK_FIREFLY_ANALYSIS=false
VITE_FEATURE_HOME_LINK_FIREFLY_SRTOOLS=false
VITE_FEATURE_HOME_LINK_AMAZING_SRTOOLS=true
VITE_FEATURE_HOME_LINK_DISCORD=true
VITE_FEATURE_HOME_LINK_HOW_TO=false
```

You can also change local branding, colors, links, patch server defaults, and background choices:

```bash
VITE_LAUNCHER_APP_NAME="HoyoToon Launcher"
VITE_LAUNCHER_SUBTITLE_MODE="game-version"
VITE_LAUNCHER_GAME_VERSION_SUBTITLE_PREFIX="Game version"
VITE_LAUNCHER_APP_ICON="/local-appicon.png"
VITE_LAUNCHER_DISCORD_URL="https://discord.gg/hoyotoon"
VITE_LAUNCHER_DEFAULT_PATCH_URL="https://hsr.hoyotoon.com"
VITE_LAUNCHER_DEFAULT_PATCH_SERVER_PORT=443
VITE_LAUNCHER_GRADIENT_FROM="#5b0479"
VITE_LAUNCHER_GRADIENT_VIA="#7d3fd1"
VITE_LAUNCHER_GRADIENT_TO="#9e6bff"
LAUNCHER_BUILD_EXE_NAME="hoyotoon-launcher"
LAUNCHER_BUILD_ICON=".local/branding/appicon.png"
```

Leave `VITE_LAUNCHER_SUBTITLE_MODE` unset, or set it to `static`, to keep the normal translated/static subtitle. Set it to `game-version` to show the selected game client's detected version in the header. `VITE_LAUNCHER_DEFAULT_PATCH_SERVER_PORT` fills in the upstream server port when the server override URL has no explicit port; unset keeps the URL as written.

When `VITE_LAUNCHER_BACKGROUND_OPTIONS` is set, local builds prune unlisted `bg-*` files from `frontend/dist` before embedding the app, which keeps personalized builds smaller.

Launcher self-updates can also be pointed at your own GitHub releases repo before building:

```bash
LAUNCHER_VERSION="1.0.7"
LAUNCHER_UPDATE_REPO="YourOrg/YourLauncher"
LAUNCHER_UPDATE_ASSET_NAME="hoyotoon-launcher.exe"
```

The updater uses the existing GitHub release flow: it checks the latest release tag in `LAUNCHER_UPDATE_REPO`, then downloads the matching asset. If `LAUNCHER_UPDATE_ASSET_NAME` is omitted while using a custom repo, the Windows build can infer it from `LAUNCHER_BUILD_EXE_NAME`, converting spaces to dots for release asset names.

`.env.local` is ignored by git, so local launcher tweaks stay out of commits and pushes.

---

## 🙏 Credits

Cyrene Launcher is a fork built on the original work by [**AzenKain**](https://github.com/AzenKain) — many thanks to the original author for the foundation this project is based on.

---

## 📄 License

MIT License — feel free to use and contribute.

---

