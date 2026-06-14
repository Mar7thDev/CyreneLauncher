const disabledValues = new Set(["0", "false", "off", "no", "disabled"])
const enabledValues = new Set(["1", "true", "on", "yes", "enabled"])

export const defaultFeatures = {
    news: true,
    languageTools: true,
    diffTools: true,
    analysis: true,
    srTools: true,
    console: true,
    howTo: true,
    about: true,
    account: true,
    externalToolLinks: true,
    discordLink: true,
    homeLinkFireflyAnalysis: true,
    homeLinkFireflySrTools: true,
    homeLinkAmazingSrTools: true,
    homeLinkDiscord: true,
    homeLinkHowTo: true,
    backgroundSelector: true,
    gameProfileSwitcher: true,
} as const

export type FeatureKey = keyof typeof defaultFeatures
export type FeatureConfig = Record<FeatureKey, boolean>

const featureEnvKeys = {
    news: "VITE_FEATURE_NEWS",
    languageTools: "VITE_FEATURE_LANGUAGE_TOOLS",
    diffTools: "VITE_FEATURE_DIFF_TOOLS",
    analysis: "VITE_FEATURE_ANALYSIS",
    srTools: "VITE_FEATURE_SR_TOOLS",
    console: "VITE_FEATURE_CONSOLE",
    howTo: "VITE_FEATURE_HOW_TO",
    about: "VITE_FEATURE_ABOUT",
    account: "VITE_FEATURE_ACCOUNT",
    externalToolLinks: "VITE_FEATURE_EXTERNAL_TOOL_LINKS",
    discordLink: "VITE_FEATURE_DISCORD_LINK",
    homeLinkFireflyAnalysis: "VITE_FEATURE_HOME_LINK_FIREFLY_ANALYSIS",
    homeLinkFireflySrTools: "VITE_FEATURE_HOME_LINK_FIREFLY_SRTOOLS",
    homeLinkAmazingSrTools: "VITE_FEATURE_HOME_LINK_AMAZING_SRTOOLS",
    homeLinkDiscord: "VITE_FEATURE_HOME_LINK_DISCORD",
    homeLinkHowTo: "VITE_FEATURE_HOME_LINK_HOW_TO",
    backgroundSelector: "VITE_FEATURE_BACKGROUND_SELECTOR",
    gameProfileSwitcher: "VITE_FEATURE_GAME_PROFILE_SWITCHER",
} as const satisfies Record<FeatureKey, string>

const parseFeatureValue = (value: string | undefined, fallback: boolean) => {
    if (value == null || value.trim() === "") return fallback

    const normalized = value.trim().toLowerCase()
    if (disabledValues.has(normalized)) return false
    if (enabledValues.has(normalized)) return true

    return fallback
}

export const features = Object.fromEntries(
    Object.entries(defaultFeatures).map(([key, fallback]) => [
        key,
        parseFeatureValue(import.meta.env[featureEnvKeys[key as FeatureKey]], fallback),
    ]),
) as FeatureConfig

export const isFeatureEnabled = (key: FeatureKey) => features[key]
