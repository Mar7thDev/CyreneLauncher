import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';

export type ServerSource = "firefly" | "custom"
export type GameProfile = "starrail" | "genshin"

// LaunchMode picks how the launcher starts the game:
//   - "fireflygo"     → local proxy + server (FireflyGo)
//   - "march7thhoney" → Go-native MITM proxy; no DLL injection, no region
export type LaunchMode = "fireflygo" | "march7thhoney"

interface SettingState {
    locale: string;
    gameProfile: GameProfile;
    gamePath: string;
    gameDir: string;
    genshinGamePath: string;
    genshinGameDir: string;
    genshinServerDir: string;
    genshinServerVersion: string;
    serverPath: string;
    proxyPath: string;
    serverVersion: string;
    proxyVersion: string;
    serverSource: ServerSource;
    launchMode: LaunchMode;
    // March7thHoney: target server URL for the MITM proxy.
    // Empty → use the built-in default (march7th.hoyotoon.com).
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
    setServerPath: (newServerPath: string) => void;
    setProxyPath: (newProxyPath: string) => void;
    setServerVersion: (newServerVersion: string) => void;
    setProxyVersion: (newProxyVersion: string) => void;
    setServerSource: (newSource: ServerSource) => void;
    setLaunchMode: (newMode: LaunchMode) => void;
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
            serverPath: "",
            proxyPath: "",
            serverVersion: "",
            proxyVersion: "",
            serverSource: "firefly",
            launchMode: "march7thhoney",
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
            setServerPath: (newServerPath: string) => set({ serverPath: newServerPath }),
            setProxyPath: (newProxyPath: string) => set({ proxyPath: newProxyPath }),
            setServerVersion: (newServerVersion: string) => set({ serverVersion: newServerVersion }),
            setProxyVersion: (newProxyVersion: string) => set({ proxyVersion: newProxyVersion }),
            // Switching source invalidates the cached server/proxy state so the
            // launcher re-prompts the user to download from the new source.
            setServerSource: (newSource: ServerSource) => set({
                serverSource: newSource,
                serverPath: "",
                proxyPath: "",
                serverVersion: "",
                proxyVersion: "",
            }),
            setLaunchMode: (newMode: LaunchMode) => set({ launchMode: newMode }),
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
        }
    )
);

export default useSettingStore;
