import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';

export type GameProfile = "starrail" | "genshin"
export type ServerTarget = "hoyotoon" | "local_test" | "local_prod" | "custom"
export type HoneyServerChannel = "test" | "prod"

// March7thHoney server base URLs, shared by game launch and the console tab.
export const DEFAULT_PATCH_URL = "https://march7th.hoyotoon.com"
export const LOCAL_SERVER_URL = "http://127.0.0.1:21000"

export function honeyChannelFromTarget(serverTarget: ServerTarget): HoneyServerChannel | null {
    switch (serverTarget) {
        case "local_test": return "test"
        case "local_prod": return "prod"
        default: return null
    }
}

// Map a dropdown option to its private-server base URL — same mapping as game launch (pure).
export function resolveServerBaseUrl(serverTarget: ServerTarget, patchTargetUrl: string): string {
    switch (serverTarget) {
        case "local_test":
        case "local_prod": return LOCAL_SERVER_URL
        case "custom": return (patchTargetUrl || "").trim() || DEFAULT_PATCH_URL
        default:       return DEFAULT_PATCH_URL // "hoyotoon"
    }
}

interface SettingState {
    locale: string;
    gameProfile: GameProfile;
    gamePath: string;
    gameDir: string;
    genshinGamePath: string;
    genshinGameDir: string;
    genshinServerDir: string;
    genshinServerVersion: string;
    // March7thHoney: installed local-server versions, tracked independently for update checks.
    honeyTestServerVersion: string;
    honeyProdServerVersion: string;
    // March7thHoney: which server to play on — remote, either launcher-managed local channel, or custom.
    serverTarget: ServerTarget;
    // March7thHoney: custom target server URL for the MITM proxy (serverTarget="custom").
    patchTargetUrl: string;
    // March7thHoney: preferred loopback port for the proxy. 0 → random free port.
    proxyPort: number;
    // March7thHoney patch options. Defaults match the reference project.
    rsaPatch: boolean;
    rsaKey: string;        // empty → use built-in default key
    webRedirect: boolean;
    webHosts: string;      // newline/comma-separated; empty → built-in default
    closingOption: {
        isMinimize: boolean;
        isAsk: boolean;
    }
    background: string;
    starRailBackground: string;
    extraBackgrounds: string[];
    setExtraBackgrounds: (newExtraBackgrounds: string[]) => void;
    setBackground: (newBackground: string) => void;
    setStarRailBackground: (newBackground: string) => void;
    setClosingOption: (newClosingOption: { isMinimize: boolean; isAsk: boolean }) => void;
    setLocale: (newLocale: string) => void;
    setGameProfile: (newProfile: GameProfile) => void;
    setGamePath: (newGamePath: string) => void;
    setGameDir: (newGameDir: string) => void;
    setGenshinGamePath: (newGamePath: string) => void;
    setGenshinGameDir: (newGameDir: string) => void;
    setGenshinServerDir: (newServerDir: string) => void;
    setGenshinServerVersion: (newServerVersion: string) => void;
    setHoneyTestServerVersion: (v: string) => void;
    setHoneyProdServerVersion: (v: string) => void;
    setServerTarget: (t: ServerTarget) => void;
    setPatchTargetUrl: (url: string) => void;
    setProxyPort: (port: number) => void;
    setRsaPatch: (v: boolean) => void;
    setRsaKey: (v: string) => void;
    setWebRedirect: (v: boolean) => void;
    setWebHosts: (v: string) => void;
}

const useSettingStore = create<SettingState>()(
    persist(
        (set) => ({
            locale: "en",
            gameProfile: "starrail",
            gamePath: "",
            gameDir: "",
            genshinGamePath: "",
            genshinGameDir: "",
            genshinServerDir: "",
            genshinServerVersion: "",
            honeyTestServerVersion: "",
            honeyProdServerVersion: "",
            serverTarget: "hoyotoon",
            patchTargetUrl: "",
            proxyPort: 8080,
            rsaPatch: true,
            rsaKey: "",
            webRedirect: true,
            webHosts: "",
            closingOption: {
                isMinimize: false,
                isAsk: true,
            },
            background: "bg-17.jpg",
            starRailBackground: "bg-17.jpg",
            extraBackgrounds: [],
            setExtraBackgrounds: (newExtraBackgrounds: string[]) => set({ extraBackgrounds: newExtraBackgrounds }),
            setBackground: (newBackground: string) => set({ background: newBackground }),
            setStarRailBackground: (newBackground: string) => set({ starRailBackground: newBackground }),
            setClosingOption: (newClosingOption: { isMinimize: boolean; isAsk: boolean }) => set({ closingOption: newClosingOption }),
            setLocale: (newLocale: string) => set({ locale: newLocale }),
            setGameProfile: (newProfile: GameProfile) => set({ gameProfile: newProfile }),
            setGamePath: (newGamePath: string) => set({ gamePath: newGamePath }),
            setGameDir: (newGameDir: string) => set({ gameDir: newGameDir }),
            setGenshinGamePath: (newGamePath: string) => set({ genshinGamePath: newGamePath }),
            setGenshinGameDir: (newGameDir: string) => set({ genshinGameDir: newGameDir }),
            setGenshinServerDir: (newServerDir: string) => set({ genshinServerDir: newServerDir }),
            setGenshinServerVersion: (newServerVersion: string) => set({ genshinServerVersion: newServerVersion }),
            setHoneyTestServerVersion: (v: string) => set({ honeyTestServerVersion: v }),
            setHoneyProdServerVersion: (v: string) => set({ honeyProdServerVersion: v }),
            setServerTarget: (t: ServerTarget) => set({ serverTarget: t }),
            setPatchTargetUrl: (url: string) => set({ patchTargetUrl: url }),
            setProxyPort: (port: number) => set({ proxyPort: port }),
            setRsaPatch: (v: boolean) => set({ rsaPatch: v }),
            setRsaKey: (v: string) => set({ rsaKey: v }),
            setWebRedirect: (v: boolean) => set({ webRedirect: v }),
            setWebHosts: (v: string) => set({ webHosts: v }),
        }),
        {
            name: 'setting-storage',
            storage: createJSONStorage(() => localStorage),
            version: 1,
            migrate: (persistedState) => {
                const state = persistedState as Record<string, unknown>
                const oldTarget = state.serverTarget
                const legacyHoneyVersion = typeof state.honeyServerVersion === "string" ? state.honeyServerVersion : ""
                return {
                    ...state,
                    serverTarget: oldTarget === "local" ? "local_test" : oldTarget,
                    honeyTestServerVersion: typeof state.honeyTestServerVersion === "string" ? state.honeyTestServerVersion : legacyHoneyVersion,
                    honeyProdServerVersion: typeof state.honeyProdServerVersion === "string" ? state.honeyProdServerVersion : "",
                }
            },
        }
    )
);

export default useSettingStore;
