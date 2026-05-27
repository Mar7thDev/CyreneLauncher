import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';

export type ServerSource = "firefly" | "custom"

// LaunchMode picks how the launcher starts the game:
//   - "fireflygo"     → local proxy + server (current behaviour)
//   - "march7thhoney" → CreateProcess(SUSPENDED) + Astrolabe.dll injection,
//                       no bundled proxy/server (the DLL's own hooks handle it)
export type LaunchMode = "fireflygo" | "march7thhoney"

// GameRegion is "" when we haven't (or can't) detected which client this is.
// In that case the launcher prompts the user before downloading a patch DLL.
export type GameRegion = "os" | "cn" | ""

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
    region: GameRegion;
    patchDllPath: string;
    patchDllVersion: string;
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
    setRegion: (newRegion: GameRegion) => void;
    setPatchDllPath: (newPath: string) => void;
    setPatchDllVersion: (newVersion: string) => void;
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
            region: "",
            patchDllPath: "",
            patchDllVersion: "",
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
            // Switching region invalidates the cached patch so the launcher
            // re-downloads the matching DLL.
            setRegion: (newRegion: GameRegion) => set({
                region: newRegion,
                patchDllPath: "",
                patchDllVersion: "",
            }),
            setPatchDllPath: (newPath: string) => set({ patchDllPath: newPath }),
            setPatchDllVersion: (newVersion: string) => set({ patchDllVersion: newVersion }),
        }),
        {
            name: 'setting-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useSettingStore;
