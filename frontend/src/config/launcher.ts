const env = import.meta.env as unknown as Record<string, string | undefined>

const readEnv = (key: string, fallback: string) => {
    const value = env[key]?.trim()
    return value ? value : fallback
}

const readOptionalEnv = (key: string) => {
    const value = env[key]?.trim()
    return value ? value : undefined
}

const readBoolEnv = (key: string, fallback: boolean) => {
    const value = env[key]?.trim().toLowerCase()
    if (!value) return fallback
    if (["1", "true", "on", "yes", "enabled"].includes(value)) return true
    if (["0", "false", "off", "no", "disabled"].includes(value)) return false
    return fallback
}

const parseOptionalPort = (value?: string | number) => {
    const raw = String(value ?? "").trim()
    if (!raw) return undefined

    const port = Number.parseInt(raw, 10)
    if (!Number.isFinite(port) || port < 1 || port > 65535) return undefined

    return port
}

const readOptionalPortEnv = (key: string) => parseOptionalPort(env[key])

const readEnvList = (key: string, fallback: string[]) => {
    const value = env[key]?.trim()
    if (!value) return fallback

    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
}

const readAssetEnv = (key: string, fallback: string) => {
    const value = readEnv(key, fallback)
    if (/^(https?:|data:|\/)/i.test(value)) return value

    return `/${value.replace(/^\.?\//, "")}`
}

const defaultBackgroundOptions = [
    "bg-columbina.jpg",
    "bg-17.jpg",
    "bg-11.jpeg",
    "bg-1.jpeg",
    "bg-2.png",
    "bg-3.png",
    "bg-6.png",
    "bg-7.jpeg",
    "bg-8.png",
    "bg-9.jpeg",
    "bg-10.jpg",
    "bg-12.jpg",
    "bg-13.jpg",
    "bg-16.jpg",
]

const themePrimary = readEnv("VITE_LAUNCHER_THEME_PRIMARY", "#ec4899")
const themeSecondary = readEnv("VITE_LAUNCHER_THEME_SECONDARY", "#0ea5e9")
const themeAccent = readEnv("VITE_LAUNCHER_THEME_ACCENT", "#8b5cf6")
const brandTextColor = readEnv("VITE_LAUNCHER_BRAND_TEXT_COLOR", themePrimary)
const panelTextColor = readEnv("VITE_LAUNCHER_PANEL_TEXT_COLOR", "#ffffff")
const defaultPatchServerPort = readOptionalPortEnv("VITE_LAUNCHER_DEFAULT_PATCH_SERVER_PORT")
const defaultPatchUrl = readEnv("VITE_LAUNCHER_DEFAULT_PATCH_URL", "https://march7th.hoyotoon.com")

export const resolvePatchServerUrl = (serverUrl: string, serverPort?: string | number) => {
    const value = serverUrl.trim()
    const port = parseOptionalPort(serverPort)
    if (!value) return value

    try {
        const parsed = new URL(/^https?:\/\//i.test(value) ? value : `http://${value}`)
        if (port) {
            parsed.port = String(port)
        } else if (!parsed.port && defaultPatchServerPort) {
            parsed.port = String(defaultPatchServerPort)
        }
        return parsed.toString().replace(/\/$/, "")
    } catch {
        return value
    }
}

export const launcherConfig = {
    appName: readEnv("VITE_LAUNCHER_APP_NAME", "Cyrene Launcher"),
    appSubtitle: readOptionalEnv("VITE_LAUNCHER_APP_SUBTITLE"),
    subtitleMode: readEnv("VITE_LAUNCHER_SUBTITLE_MODE", "static").toLowerCase(),
    gameVersionSubtitlePrefix: readEnv("VITE_LAUNCHER_GAME_VERSION_SUBTITLE_PREFIX", "Game version"),
    gameVersionUnknownSubtitle: readEnv("VITE_LAUNCHER_GAME_VERSION_UNKNOWN_SUBTITLE", "Game version unknown"),
    gameVersionMissingSubtitle: readEnv("VITE_LAUNCHER_GAME_VERSION_MISSING_SUBTITLE", "No game selected"),
    appIcon: readAssetEnv("VITE_LAUNCHER_APP_ICON", "/appicon.png"),
    brandedChrome: readBoolEnv("VITE_LAUNCHER_BRANDED_CHROME", false),
    projectAuthor: readEnv("VITE_LAUNCHER_PROJECT_AUTHOR", "Firefly Shelter (original) · Cyrene (fork)"),
    projectRepoUrl: readEnv("VITE_LAUNCHER_PROJECT_REPO_URL", "https://git.kain.io.vn/Firefly-Shelter/Firefly_Launcher"),
    discordUrl: readEnv("VITE_LAUNCHER_DISCORD_URL", "https://discord.gg/CyreneEchoes"),
    defaultPatchUrl: resolvePatchServerUrl(defaultPatchUrl),
    defaultPatchServerPort,
    gradientFrom: readEnv("VITE_LAUNCHER_GRADIENT_FROM", "#ec4899"),
    gradientVia: readEnv("VITE_LAUNCHER_GRADIENT_VIA", "#8b5cf6"),
    gradientTo: readEnv("VITE_LAUNCHER_GRADIENT_TO", "#0ea5e9"),
    themePrimary,
    themeSecondary,
    themeAccent,
    brandTextColor,
    mutedTextColor: readEnv("VITE_LAUNCHER_MUTED_TEXT_COLOR", `color-mix(in srgb, ${brandTextColor} 72%, white 28%)`),
    softBackgroundColor: readEnv("VITE_LAUNCHER_THEME_SOFT_BACKGROUND_COLOR", `color-mix(in srgb, ${themePrimary} 9%, white 91%)`),
    softBackgroundStrongColor: readEnv("VITE_LAUNCHER_THEME_SOFT_BACKGROUND_STRONG_COLOR", `color-mix(in srgb, ${themePrimary} 16%, white 84%)`),
    softBorderColor: readEnv("VITE_LAUNCHER_THEME_SOFT_BORDER_COLOR", `color-mix(in srgb, ${themePrimary} 26%, white 74%)`),
    softShadowColor: readEnv("VITE_LAUNCHER_THEME_SOFT_SHADOW_COLOR", `color-mix(in srgb, ${themePrimary} 18%, transparent)`),
    overlayBackgroundColor: readEnv("VITE_LAUNCHER_THEME_OVERLAY_BACKGROUND_COLOR", `color-mix(in srgb, ${themePrimary} 8%, transparent)`),
    panelBackgroundColor: readEnv("VITE_LAUNCHER_PANEL_BACKGROUND_COLOR", `color-mix(in srgb, ${themePrimary} 66%, #120014 34%)`),
    panelBorderColor: readEnv("VITE_LAUNCHER_PANEL_BORDER_COLOR", "rgb(255 255 255 / 0.16)"),
    panelTextColor,
    panelHoverBackgroundColor: readEnv("VITE_LAUNCHER_PANEL_HOVER_BACKGROUND_COLOR", "rgb(255 255 255 / 0.12)"),
    panelHoverTextColor: readEnv("VITE_LAUNCHER_PANEL_HOVER_TEXT_COLOR", panelTextColor),
    base100Color: readOptionalEnv("VITE_LAUNCHER_THEME_BASE_100_COLOR"),
    base200Color: readOptionalEnv("VITE_LAUNCHER_THEME_BASE_200_COLOR"),
    base300Color: readOptionalEnv("VITE_LAUNCHER_THEME_BASE_300_COLOR"),
    baseContentColor: readOptionalEnv("VITE_LAUNCHER_THEME_BASE_CONTENT_COLOR"),
    successColor: readOptionalEnv("VITE_LAUNCHER_THEME_SUCCESS_COLOR"),
    warningColor: readOptionalEnv("VITE_LAUNCHER_THEME_WARNING_COLOR"),
    errorColor: readOptionalEnv("VITE_LAUNCHER_THEME_ERROR_COLOR"),
    defaultBackground: readEnv("VITE_LAUNCHER_DEFAULT_BACKGROUND", "bg-17.jpg"),
    starRailBackground: readEnv("VITE_LAUNCHER_STARRAIL_BACKGROUND", "bg-17.jpg"),
    genshinBackground: readEnv("VITE_LAUNCHER_GENSHIN_BACKGROUND", "bg-columbina.jpg"),
    backgroundOptions: readEnvList("VITE_LAUNCHER_BACKGROUND_OPTIONS", defaultBackgroundOptions),
} as const

export const applyLauncherTheme = () => {
    const root = document.documentElement
    const setOptionalProperty = (name: string, value?: string) => {
        if (value) root.style.setProperty(name, value)
    }

    root.style.setProperty("--launcher-gradient-from", launcherConfig.gradientFrom)
    root.style.setProperty("--launcher-gradient-via", launcherConfig.gradientVia)
    root.style.setProperty("--launcher-gradient-to", launcherConfig.gradientTo)
    root.style.setProperty("--launcher-primary", launcherConfig.themePrimary)
    root.style.setProperty("--launcher-secondary", launcherConfig.themeSecondary)
    root.style.setProperty("--launcher-accent", launcherConfig.themeAccent)
    root.style.setProperty("--launcher-brand-text", launcherConfig.brandTextColor)
    root.style.setProperty("--launcher-muted-text", launcherConfig.mutedTextColor)
    root.style.setProperty("--launcher-soft-bg", launcherConfig.softBackgroundColor)
    root.style.setProperty("--launcher-soft-bg-strong", launcherConfig.softBackgroundStrongColor)
    root.style.setProperty("--launcher-soft-border", launcherConfig.softBorderColor)
    root.style.setProperty("--launcher-soft-shadow", launcherConfig.softShadowColor)
    root.style.setProperty("--launcher-overlay-bg", launcherConfig.overlayBackgroundColor)
    root.style.setProperty("--launcher-panel-bg", launcherConfig.panelBackgroundColor)
    root.style.setProperty("--launcher-panel-border", launcherConfig.panelBorderColor)
    root.style.setProperty("--launcher-panel-text", launcherConfig.panelTextColor)
    root.style.setProperty("--launcher-panel-hover-bg", launcherConfig.panelHoverBackgroundColor)
    root.style.setProperty("--launcher-panel-hover-text", launcherConfig.panelHoverTextColor)
    root.style.setProperty("--color-primary", launcherConfig.themePrimary)
    root.style.setProperty("--color-secondary", launcherConfig.themeSecondary)
    root.style.setProperty("--color-accent", launcherConfig.themeAccent)
    setOptionalProperty("--color-base-100", launcherConfig.base100Color)
    setOptionalProperty("--color-base-200", launcherConfig.base200Color)
    setOptionalProperty("--color-base-300", launcherConfig.base300Color)
    setOptionalProperty("--color-base-content", launcherConfig.baseContentColor)
    setOptionalProperty("--color-success", launcherConfig.successColor)
    setOptionalProperty("--color-warning", launcherConfig.warningColor)
    setOptionalProperty("--color-error", launcherConfig.errorColor)

    document.title = launcherConfig.appName

    const icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (icon) {
        icon.href = launcherConfig.appIcon
    }
}
