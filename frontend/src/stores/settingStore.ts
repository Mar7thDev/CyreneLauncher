import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';

export type ServerSource = "firefly" | "custom"

// LaunchMode picks how the launcher starts the game:
//   - "fireflygo"     → local proxy + server (FireflyGo)
//   - "march7thhoney" → Go-native MITM proxy; no DLL injection, no region
export type LaunchMode = "fireflygo" | "march7thhoney"

interface SettingState {
    locale: string;
    gamePath: string;
    gameDir: string;
    serverPath: string;
    proxyPath: string;
    serverVersion: string;
    proxyVersion: string;
    serverSource: ServerSource;
    launchMode: LaunchMode;
    // March7thHoney: target server URL for the MITM proxy.
    // Empty → use the built-in default (march7th.hoyotoon.com).
    patchTargetUrl: string;
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
    extraBackgrounds: string[];
    setExtraBackgrounds: (newExtraBackgrounds: string[]) => void;
    setBackground: (newBackground: string) => void;
    setClosingOption: (newClosingOption: { isMinimize: boolean; isAsk: boolean }) => void;
    setLocale: (newLocale: string) => void;
    setGamePath: (newGamePath: string) => void;
    setGameDir: (newGameDir: string) => void;
    setServerPath: (newServerPath: string) => void;
    setProxyPath: (newProxyPath: string) => void;
    setServerVersion: (newServerVersion: string) => void;
    setProxyVersion: (newProxyVersion: string) => void;
    setServerSource: (newSource: ServerSource) => void;
    setLaunchMode: (newMode: LaunchMode) => void;
    setPatchTargetUrl: (url: string) => void;
    setRsaPatch: (v: boolean) => void;
    setRsaKey: (v: string) => void;
    setWebRedirect: (v: boolean) => void;
    setWebHosts: (v: string) => void;
}

const useSettingStore = create<SettingState>()(
    persist(
        (set) => ({
            locale: "en",
            gamePath: "",
            gameDir: "",
            serverPath: "",
            proxyPath: "",
            serverVersion: "",
            proxyVersion: "",
            serverSource: "firefly",
            launchMode: "fireflygo",
            patchTargetUrl: "",
            rsaPatch: true,
            rsaKey: "",
            webRedirect: true,
            webHosts: "",
            closingOption: {
                isMinimize: false,
                isAsk: true,
            },
            background: "bg-17.jpg",
            extraBackgrounds: [],
            setExtraBackgrounds: (newExtraBackgrounds: string[]) => set({ extraBackgrounds: newExtraBackgrounds }),
            setBackground: (newBackground: string) => set({ background: newBackground }),
            setClosingOption: (newClosingOption: { isMinimize: boolean; isAsk: boolean }) => set({ closingOption: newClosingOption }),
            setLocale: (newLocale: string) => set({ locale: newLocale }),
            setGamePath: (newGamePath: string) => set({ gamePath: newGamePath }),
            setGameDir: (newGameDir: string) => set({ gameDir: newGameDir }),
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
