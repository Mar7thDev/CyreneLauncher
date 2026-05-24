
import { create } from 'zustand'

interface DiffState {
    folderCheckResult: 'success' | 'error' | null,
    isLoading: {game: boolean, diff: boolean},
    diffDir: string,
    diffCheckResult: 'success' | 'error' | null,
    isDiffLoading: boolean,
    progressUpdate: number,
    maxProgressUpdate: number,
    messageUpdate: string,
    stageType: string,
    setMessageUpdate: (value: string) => void,
    setIsLoading: (value: {game: boolean, diff: boolean}) => void,
    setFolderCheckResult: (value: 'success' | 'error' | null) => void,
    setDiffDir: (value: string) => void,
    setDiffCheckResult: (value: 'success' | 'error' | null) => void,
    setIsDiffLoading: (value: boolean) => void,
    setProgressUpdate: (value: number) => void,
    setMaxProgressUpdate: (value: number) => void,
    setStageType: (value: string) => void,
}

const useDiffStore = create<DiffState>((set, get) => ({
    isLoading: {game: false, diff: false},
    folderCheckResult: null,
    diffDir: "",
    diffCheckResult: null,
    isDiffLoading: false,
    progressUpdate: 0,
    maxProgressUpdate: 0,
    messageUpdate: "",
    stageType: "",
    setIsLoading: (value: {game: boolean, diff: boolean}) => set({ isLoading: value }),
    setFolderCheckResult: (value: 'success' | 'error' | null) => set({ folderCheckResult: value }),
    setDiffDir: (value: string) => set({ diffDir: value }),
    setDiffCheckResult: (value: 'success' | 'error' | null) => set({ diffCheckResult: value }),
    setIsDiffLoading: (value: boolean) => set({ isDiffLoading: value }),
    setProgressUpdate: (value: number) => set({ progressUpdate: value }),
    setMaxProgressUpdate: (value: number) => set({ maxProgressUpdate: value }),
    setMessageUpdate: (value: string) => set({ messageUpdate: value }),
    setStageType: (value: string) => set({ stageType: value }),
}));

export default useDiffStore;