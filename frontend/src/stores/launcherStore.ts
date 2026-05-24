
import { create } from 'zustand'

interface LauncherState {
    downloadType: string;
    serverReady: boolean;
    proxyReady: boolean;
    isDownloading: boolean;
    serverRunning: boolean;
    proxyRunning: boolean;
    isLoading: boolean;
    gameRunning: boolean;
    progressDownload: number;
    downloadSpeed: string;
    launcherVersion: string;
    updateData: Record<'server' | 'proxy' | 'launcher', { isUpdate: boolean, isExists: boolean, version: string }>;
    setDownloadType: (value: string) => void;
    setServerReady: (value: boolean) => void;
    setProxyReady: (value: boolean) => void;
    setIsDownloading: (value: boolean) => void;
    setServerRunning: (value: boolean) => void;
    setProxyRunning: (value: boolean) => void;
    setIsLoading: (value: boolean) => void;
    setGameRunning: (value: boolean) => void;
    setProgressDownload: (value: number) => void;
    setLauncherVersion: (value: string) => void;
    setDownloadSpeed: (value: string) => void;
    setUpdateData: (value: Record<'server' | 'proxy' | 'launcher', { isUpdate: boolean, isExists: boolean, version: string }>) => void;
}

const useLauncherStore = create<LauncherState>((set, get) => ({
    isLoading: false,
    downloadType: "",
    serverReady: false,
    proxyReady: false,
    isDownloading: false,
    serverRunning: false,
    proxyRunning: false,
    gameRunning: false,
    progressDownload: 0,
    downloadSpeed: "",
    launcherVersion: "",
    updateData: {
        server: { isUpdate: false, isExists: false, version: "" },
        proxy: { isUpdate: false, isExists: false, version: "" },
        launcher: { isUpdate: false, isExists: true, version: "" },
    },
    setIsLoading: (value: boolean) => set({ isLoading: value }),
    setDownloadType: (value: string) => set({ downloadType: value }),
    setServerReady: (value: boolean) => set({ serverReady: value }),
    setProxyReady: (value: boolean) => set({ proxyReady: value }),
    setIsDownloading: (value: boolean) => set({ isDownloading: value }),
    setServerRunning: (value: boolean) => set({ serverRunning: value }),
    setProxyRunning: (value: boolean) => set({ proxyRunning: value }),
    setGameRunning: (value: boolean) => set({ gameRunning: value }),
    setProgressDownload: (value: number) => set({ progressDownload: value }),
    setLauncherVersion: (value: string) => set({ launcherVersion: value }),
    setDownloadSpeed: (value: string) => set({ downloadSpeed: value }),
    setUpdateData: (value: Record<'server' | 'proxy' | 'launcher', { isUpdate: boolean, isExists: boolean, version: string }>) => set({ updateData: value }),
}));

export default useLauncherStore;