import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';

export type ServerSource = "firefly" | "custom"

interface SettingState {
    locale: string;
    gamePath: string;
    gameDir: string;
    serverPath: string;
    proxyPath: string;
    serverVersion: string;
    proxyVersion: string;
    serverSource: ServerSource;
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
        }),
        {
            name: 'setting-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useSettingStore;
