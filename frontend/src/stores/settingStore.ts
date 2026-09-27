import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';

export type GameProfile = "starrail" | "genshin"
export type ServerTarget = "march7th" | "hoyotoon" | "kunps"
export type ServerRegion = "hk" | "eu" | "cn"

// The three March7thHoney server channels, in the order they are offered.
// March7th.cc is the default; KunPS is the backup. Keep the URLs in sync with
// pkg/constant/constant.go (console / handbook fall back to the Go default).
export const SERVER_CHANNELS: readonly { id: ServerTarget; url: string; region: ServerRegion }[] = [
    { id: "march7th", url: "https://server.march7th.cc", region: "hk" },
    { id: "hoyotoon", url: "https://march7th.hoyotoon.com", region: "eu" },
    { id: "kunps", url: "http://210.16.175.19:520", region: "cn" },
]
export const DEFAULT_SERVER_TARGET: ServerTarget = "march7th"

export function isServerTarget(value: unknown): value is ServerTarget {
    return SERVER_CHANNELS.some(c => c.id === value)
}

// Map a channel to its private-server base URL — same mapping as game launch (pure).
export function resolveServerBaseUrl(serverTarget: ServerTarget): string {
    return (SERVER_CHANNELS.find(c => c.id === serverTarget) ?? SERVER_CHANNELS[0]).url
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
    // March7thHoney: which server channel to play on.
    serverTarget: ServerTarget;
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
    setServerTarget: (t: ServerTarget) => void;
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
            serverTarget: DEFAULT_SERVER_TARGET,
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
            setServerTarget: (t: ServerTarget) => set({ serverTarget: isServerTarget(t) ? t : DEFAULT_SERVER_TARGET }),
            setProxyPort: (port: number) => set({ proxyPort: port }),
            setRsaPatch: (v: boolean) => set({ rsaPatch: v }),
            setRsaKey: (v: string) => set({ rsaKey: v }),
            setWebRedirect: (v: boolean) => set({ webRedirect: v }),
            setWebHosts: (v: string) => set({ webHosts: v }),
        }),
        {
            name: 'setting-storage',
            storage: createJSONStorage(() => localStorage),
            version: 3,
            migrate: (persistedState, version) => {
                const {
                    patchTargetUrl: _url,
                    honeyServerVersion: _v1,
                    honeyTestServerVersion: _v2,
                    honeyProdServerVersion: _v3,
                    ...state
                } = persistedState as Record<string, unknown>
                // v3 keeps only the three channels. Local/custom targets are gone, and
                // KunPS — the automatic default of the v2 KunPS edition — is now only the
                // backup, so it moves to the new default. HoyoToon was always a choice.
                let serverTarget = state.serverTarget
                if (version < 3 && serverTarget === "kunps") serverTarget = DEFAULT_SERVER_TARGET
                return { ...state, serverTarget: isServerTarget(serverTarget) ? serverTarget : DEFAULT_SERVER_TARGET }
            },
        }
    )
);

export default useSettingStore;
