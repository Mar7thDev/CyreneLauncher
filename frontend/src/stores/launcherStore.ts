
import { create } from 'zustand'

type UpdateSlot = { isUpdate: boolean, isExists: boolean, version: string }

interface LauncherState {
    downloadType: string;
    serverReady: boolean;
    patchReady: boolean;
    isDownloading: boolean;
    serverRunning: boolean;
    isLoading: boolean;
    gameRunning: boolean;
    progressDownload: number;
    downloadSpeed: string;
    launcherVersion: string;
    updateData: Record<'server' | 'proxy' | 'patch' | 'launcher', UpdateSlot>;
    setDownloadType: (value: string) => void;
    setServerReady: (value: boolean) => void;
    setPatchReady: (value: boolean) => void;
    setIsDownloading: (value: boolean) => void;
    setServerRunning: (value: boolean) => void;
    setIsLoading: (value: boolean) => void;
    setGameRunning: (value: boolean) => void;
    setProgressDownload: (value: number) => void;
    setLauncherVersion: (value: string) => void;
    setDownloadSpeed: (value: string) => void;
    setUpdateData: (value: Record<'server' | 'proxy' | 'patch' | 'launcher', UpdateSlot>) => void;
}

const useLauncherStore = create<LauncherState>((set) => ({
    isLoading: false,
    downloadType: "",
    serverReady: false,
    patchReady: false,
    isDownloading: false,
    serverRunning: false,
    gameRunning: false,
    progressDownload: 0,
    downloadSpeed: "",
    launcherVersion: "",
    updateData: {
        server: { isUpdate: false, isExists: false, version: "" },
        proxy: { isUpdate: false, isExists: false, version: "" },
        patch: { isUpdate: false, isExists: false, version: "" },
        launcher: { isUpdate: false, isExists: true, version: "" },
    },
    setIsLoading: (value: boolean) => set({ isLoading: value }),
    setDownloadType: (value: string) => set({ downloadType: value }),
    setServerReady: (value: boolean) => set({ serverReady: value }),
    setPatchReady: (value: boolean) => set({ patchReady: value }),
    setIsDownloading: (value: boolean) => set({ isDownloading: value }),
    setServerRunning: (value: boolean) => set({ serverRunning: value }),
    setGameRunning: (value: boolean) => set({ gameRunning: value }),
    setProgressDownload: (value: number) => set({ progressDownload: value }),
    setLauncherVersion: (value: string) => set({ launcherVersion: value }),
    setDownloadSpeed: (value: string) => set({ downloadSpeed: value }),
    setUpdateData: (value) => set({ updateData: value }),
}));

export default useLauncherStore;
