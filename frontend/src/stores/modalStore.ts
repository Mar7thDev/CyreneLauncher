
import { create } from 'zustand'

interface ModalState {
    isOpenDownloadDataModal: boolean;
    isOpenUpdateDataModal: boolean;
    isOpenSelfUpdateModal: boolean;
    isOpenCloseModal: boolean;
    isOpenSettingModal: boolean;
    setIsOpenDownloadDataModal: (modal: boolean) => void;
    setIsOpenUpdateDataModal: (modal: boolean) => void;
    setIsOpenSelfUpdateModal: (modal: boolean) => void;
    setIsOpenCloseModal: (modal: boolean) => void;
    setIsOpenSettingModal: (modal: boolean) => void;
}

const useModalStore = create<ModalState>((set, get) => ({
    isOpenDownloadDataModal: false,
    isOpenUpdateDataModal: false,
    isOpenSelfUpdateModal: false,
    isOpenCloseModal: false,
    isOpenSettingModal: false,
    setIsOpenDownloadDataModal: (modal: boolean) => set({ isOpenDownloadDataModal: modal }),
    setIsOpenUpdateDataModal: (modal: boolean) => set({ isOpenUpdateDataModal: modal }),
    setIsOpenSelfUpdateModal: (modal: boolean) => set({ isOpenSelfUpdateModal: modal }),
    setIsOpenCloseModal: (modal: boolean) => set({ isOpenCloseModal: modal }),
    setIsOpenSettingModal: (modal: boolean) => set({ isOpenSettingModal: modal }),
}));

export default useModalStore;