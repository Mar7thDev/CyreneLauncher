
import { create } from 'zustand'
import type { HoneyServerChannel } from './settingStore'

interface ModalState {
    isOpenDownloadDataModal: boolean;
    isOpenUpdateDataModal: boolean;
    isOpenSelfUpdateModal: boolean;
    isOpenCloseModal: boolean;
    isOpenSettingModal: boolean;
    isOpenHoneyDownloadModal: boolean;
    isOpenHoneyUpdateModal: boolean;
    honeyModalChannel: HoneyServerChannel;
    honeyModalVersion: string;
    setIsOpenDownloadDataModal: (modal: boolean) => void;
    setIsOpenUpdateDataModal: (modal: boolean) => void;
    setIsOpenSelfUpdateModal: (modal: boolean) => void;
    setIsOpenCloseModal: (modal: boolean) => void;
    setIsOpenSettingModal: (modal: boolean) => void;
    setIsOpenHoneyDownloadModal: (modal: boolean) => void;
    setIsOpenHoneyUpdateModal: (modal: boolean) => void;
    openHoneyDownloadModal: (channel: HoneyServerChannel) => void;
    openHoneyUpdateModal: (channel: HoneyServerChannel, version: string) => void;
}

const useModalStore = create<ModalState>((set) => ({
    isOpenDownloadDataModal: false,
    isOpenUpdateDataModal: false,
    isOpenSelfUpdateModal: false,
    isOpenCloseModal: false,
    isOpenSettingModal: false,
    isOpenHoneyDownloadModal: false,
    isOpenHoneyUpdateModal: false,
    honeyModalChannel: "test",
    honeyModalVersion: "",
    setIsOpenDownloadDataModal: (modal: boolean) => set({ isOpenDownloadDataModal: modal }),
    setIsOpenUpdateDataModal: (modal: boolean) => set({ isOpenUpdateDataModal: modal }),
    setIsOpenSelfUpdateModal: (modal: boolean) => set({ isOpenSelfUpdateModal: modal }),
    setIsOpenCloseModal: (modal: boolean) => set({ isOpenCloseModal: modal }),
    setIsOpenSettingModal: (modal: boolean) => set({ isOpenSettingModal: modal }),
    setIsOpenHoneyDownloadModal: (modal: boolean) => set({ isOpenHoneyDownloadModal: modal }),
    setIsOpenHoneyUpdateModal: (modal: boolean) => set({ isOpenHoneyUpdateModal: modal }),
    openHoneyDownloadModal: (channel: HoneyServerChannel) => set({ honeyModalChannel: channel, honeyModalVersion: "", isOpenHoneyDownloadModal: true }),
    openHoneyUpdateModal: (channel: HoneyServerChannel, version: string) => set({ honeyModalChannel: channel, honeyModalVersion: version, isOpenHoneyUpdateModal: true }),
}));

export default useModalStore;
