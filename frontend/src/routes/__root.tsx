import { useEffect } from 'react';
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { ToastContainer } from 'react-toastify'
import { useGlobalEvents } from '@/hooks';
import useModalStore from '@/stores/modalStore';;
import SettingModal from '@/components/settingModal';
import CloseModal from '@/components/closeModal';
import Header from '@/components/header';
import LoginGate from '@/components/loginGate';
import { motion, AnimatePresence } from 'motion/react'
import { features } from '@/config/features';
import { applyLauncherTheme } from '@/config/launcher';

export const Route = createRootRoute({
    component: RootLayout
})

function RootLayout() {
    const { setIsOpenCloseModal, isOpenCloseModal, isOpenSettingModal, setIsOpenSettingModal } = useModalStore()
    const location = useLocation()

    useGlobalEvents();
    useEffect(() => applyLauncherTheme(), [])

    return (
        <>
            <Header />

            <div className="min-h-[78vh]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </div>

            <CloseModal isOpen={isOpenCloseModal} onClose={() => setIsOpenCloseModal(false)} />
            <SettingModal isOpen={isOpenSettingModal} onClose={() => setIsOpenSettingModal(false)} />
            {features.account && <LoginGate />}
            <ToastContainer />
        </>
    )
}
