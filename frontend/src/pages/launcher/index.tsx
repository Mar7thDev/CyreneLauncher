import { useEffect } from 'react';
import { Play, Menu, FolderOpen, MessageCircleQuestionMark } from 'lucide-react';
import { AppService } from '@bindings/firefly-launcher/internal/app-service';
import { FSService } from '@bindings/firefly-launcher/internal/fs-service';
import { March7thHoneyService } from '@bindings/firefly-launcher/internal/march7thhoney-service';
import { toast } from 'react-toastify';
import path from 'path-browserify'
import useSettingStore from '@/stores/settingStore';
import useModalStore from '@/stores/modalStore';
import useLauncherStore from '@/stores/launcherStore';
import { motion } from 'motion/react';
import { Link } from '@tanstack/react-router';
import { CheckUpdateLauncher, CheckUpdatePatch, CheckUpdateProxy, CheckUpdateServer, sleep, UpdateLauncher, UpdatePatch, UpdateProxy, UpdateServer } from '@/helper';
import UpdateModal from '@/components/updateModal';
import { BackgroundSelector } from '@/components/backgroudModal';
import { useTranslation } from 'react-i18next';

export default function LauncherPage() {
    const {
        gamePath, setGamePath, setGameDir,
        serverPath, proxyPath, gameDir,
        serverVersion, proxyVersion, background,
        launchMode, region, setRegion, patchDllPath, patchDllVersion,
        setServerPath, setProxyPath,
    } = useSettingStore()
    const { t } = useTranslation()
    const {
        isOpenDownloadDataModal, isOpenUpdateDataModal, isOpenSelfUpdateModal, isOpenRegionModal,
        setIsOpenDownloadDataModal, setIsOpenUpdateDataModal, setIsOpenSelfUpdateModal, setIsOpenRegionModal,
    } = useModalStore()
    const {
        isLoading, downloadType, serverReady, proxyReady, patchReady, isDownloading,
        serverRunning, proxyRunning, gameRunning, progressDownload, downloadSpeed,
        updateData, setLauncherVersion, setIsLoading, setDownloadType,
        setServerReady, setProxyReady, setPatchReady, setIsDownloading,
        setServerRunning, setProxyRunning, setGameRunning, setUpdateData,
    } = useLauncherStore()

    const widgetLinks = [
        { tooltip: "Firefly SRAnalysis", href: "https://sranalysis.punklorde.org", img: "https://sranalysis.punklorde.org/ff-sranalysis.png" },
        { tooltip: "Firefly SRTools",    href: "https://srtools.punklorde.org",    img: "https://srtools.punklorde.org/ff-srtool.png" },
        { tooltip: "Amazing's SRTools", href: "https://srtools.neonteam.dev",      img: "https://icons.duckduckgo.com/ip3/srtools.neonteam.dev.ico" },
    ]

    const openExternal = async (url: string) => {
        try { await AppService.OpenURL(url) }
        catch { window.open(url, "_blank") }
    }

    useEffect(() => {
        const check = async () => {
            if (launchMode === "march7thhoney") {
                if (!region || !patchDllVersion) { setPatchReady(false); return }
                setPatchReady(await FSService.FileExists(patchDllPath))
                return
            }
            if (!serverVersion || !proxyVersion) { setServerReady(false); setProxyReady(false); return }
            setServerReady(await FSService.FileExists(serverPath))
            setProxyReady(await FSService.FileExists(proxyPath))
        }
        check()
    }, [launchMode, serverPath, proxyPath, serverVersion, proxyVersion, patchDllPath, patchDllVersion, region])

    // Region detection: whenever we're in march7thhoney mode and have a game
    // directory but no region set, try to detect it from BinaryVersion.bytes.
    // If detection is ambiguous, open the region picker modal.
    useEffect(() => {
        if (launchMode !== "march7thhoney") return
        if (!gameDir) return
        if (region) return
        (async () => {
            const detected = await March7thHoneyService.DetectRegion(gameDir)
            if (detected === "os" || detected === "cn") {
                setRegion(detected)
                toast.success(t("home.toast_region_detected", { region: detected.toUpperCase() }))
            } else {
                setIsOpenRegionModal(true)
            }
        })()
    }, [launchMode, gameDir, region])

    // Gate march7thhoney actions on a known region. Returns true if we can
    // proceed; otherwise opens the picker modal and returns false.
    const ensureRegion = (): boolean => {
        if (region) return true
        if (!gameDir) {
            toast.error(t("home.toast_region_needs_game"))
            return false
        }
        setIsOpenRegionModal(true)
        return false
    }

    useEffect(() => {
        const checkStartUp = async () => {
            const [_, version] = await AppService.GetCurrentLauncherVersion()
            setLauncherVersion(version)
            const launcherData = await CheckUpdateLauncher()
            if (launcherData.isUpdate) {
                setUpdateData({
                    server: { isUpdate: false, isExists: false, version: "" },
                    proxy: { isUpdate: false, isExists: false, version: "" },
                    patch: { isUpdate: false, isExists: false, version: "" },
                    launcher: launcherData,
                })
                setIsOpenSelfUpdateModal(true)
                return
            }

            const exitGame = await FSService.FileExists(gamePath)
            if (!exitGame) { setGameRunning(false); setGamePath(""); setGameDir("") }

            // Auto-relink: if a previous install already dropped the server /
            // proxy binaries at the default paths, restore them to settings so
            // we don't ask the user to redownload what's already on disk.
            // Version stays empty → an update modal may still pop (declinable),
            // but the forced download modal won't.
            let effServerPath = serverPath
            let effProxyPath  = proxyPath
            if (launchMode === "fireflygo") {
                const defaultServer = "./server/firefly-go_win.exe"
                const defaultProxy  = "./proxy/firefly-go-proxy.exe"
                if (!effServerPath && await FSService.FileExists(defaultServer)) {
                    effServerPath = defaultServer
                    setServerPath(defaultServer)
                }
                if (!effProxyPath && await FSService.FileExists(defaultProxy)) {
                    effProxyPath = defaultProxy
                    setProxyPath(defaultProxy)
                }
            }

            if (launchMode === "march7thhoney") {
                // Skip the patch check until we know the region — otherwise
                // we'd pop the download modal for a DLL we can't choose yet.
                if (!region) {
                    setPatchReady(false)
                    return
                }
                const patchData = await CheckUpdatePatch(region, patchDllPath, patchDllVersion)
                setUpdateData({
                    server: { isUpdate: false, isExists: true, version: "" },
                    proxy: { isUpdate: false, isExists: true, version: "" },
                    patch: patchData,
                    launcher: launcherData,
                })
                if (!patchData.isExists) { setPatchReady(false); setIsOpenDownloadDataModal(true); return }
                if (patchData.isUpdate)  { setPatchReady(true);  setIsOpenUpdateDataModal(true);  return }
                setPatchReady(true)
                return
            }

            const serverData = await CheckUpdateServer(effServerPath, serverVersion)
            const proxyData = await CheckUpdateProxy(effProxyPath, proxyVersion)
            setUpdateData({
                server: serverData,
                proxy: proxyData,
                patch: { isUpdate: false, isExists: false, version: "" },
                launcher: launcherData,
            })
            if (!serverData.isExists || !proxyData.isExists) {
                setServerReady(false); setProxyReady(false); setIsOpenDownloadDataModal(true); return
            }
            if (serverData.isUpdate || proxyData.isUpdate) {
                setServerReady(true); setProxyReady(true); setIsOpenUpdateDataModal(true); return
            }
            setServerReady(true); setProxyReady(true)
        }
        checkStartUp()
    }, [launchMode, region]);

    const handlePickFile = async () => {
        try {
            setIsLoading(true)
            const basePath = await FSService.PickFile("exe")
            if (basePath.endsWith("StarRail.exe") || basePath.endsWith("launcher.exe")) {
                const normalized = basePath.replace(/\\/g, '/')
                const folderPath = path.dirname(normalized)
                const exists = await FSService.DirExists(`${folderPath}/StarRail_Data/StreamingAssets/DesignData/Windows`)
                if (!exists) { toast.error(t("home.error_game_dir")) }
                else { setGamePath(basePath); setGameDir(folderPath); toast.success(t("home.game_path_success")) }
            } else { toast.error(t("home.error_file_type")) }
        } catch (err: any) { toast.error(t("home.toast_pick_folder_error"), err) }
        finally { setIsLoading(false) }
    }

    const handleStartGame = async () => {
        if (!gamePath || gameRunning) return
        try {
            setIsLoading(true)

            if (launchMode === "march7thhoney") {
                if (gamePath.endsWith("launcher.exe")) {
                    toast.error(t("home.toast_march7th_needs_starrail"))
                    return
                }
                if (!ensureRegion()) return
                const [ok, err] = await March7thHoneyService.Start(gamePath, patchDllPath)
                if (!ok) { toast.error(t("home.toast_start_game_failed") + err); return }
                setGameRunning(true)
                return
            }

            if (!proxyRunning && !gamePath.endsWith("launcher.exe")) {
                const [ok, err] = await FSService.StartWithConsole(proxyPath)
                if (!ok) { toast.error(t("home.toast_start_proxy_failed") + err); return }
                setProxyRunning(true)
            }
            await sleep(500)
            if (!serverRunning) {
                const [ok, err] = await FSService.StartWithConsole(serverPath)
                if (!ok) { toast.error(t("home.toast_start_server_failed") + err); return }
                setServerRunning(true)
            }
            await sleep(1000)
            if (gamePath.endsWith("launcher.exe")) {
                const [ok, err] = await FSService.StartWithConsole(gamePath)
                if (!ok) { toast.error(t("home.toast_start_game_failed") + err); return }
            } else {
                const [ok, err] = await FSService.StartApp(gamePath)
                if (!ok) { toast.error(t("home.toast_start_game_failed") + err); return }
            }
            setGameRunning(true)
        } catch (err: any) { toast.error(t("home.toast_start_game_error"), err) }
        finally { setIsLoading(false) }
    }

    const handlerUpdateData = async () => {
        setIsDownloading(true)
        if (updateData.launcher.isUpdate) {
            await UpdateLauncher(updateData.launcher.version)
            setUpdateData({ ...updateData, launcher: { isUpdate: false, isExists: true, version: updateData.launcher.version } })
            setIsOpenSelfUpdateModal(true)
        }
        if (launchMode === "march7thhoney") {
            if (!ensureRegion()) { setDownloadType(""); setIsDownloading(false); return }
            if (updateData.patch.isUpdate || !updateData.patch.isExists) {
                await UpdatePatch(region, updateData.patch.version)
                setPatchReady(true)
                setUpdateData({ ...updateData, patch: { isUpdate: false, isExists: true, version: updateData.patch.version } })
            }
        } else {
            if (updateData.server.isUpdate || !updateData.server.isExists) {
                await UpdateServer(updateData.server.version)
                setServerReady(true)
                setUpdateData({ ...updateData, server: { isUpdate: false, isExists: true, version: updateData.server.version } })
            }
            if (updateData.proxy.isUpdate || !updateData.proxy.isExists) {
                await UpdateProxy(updateData.proxy.version)
                setProxyReady(true)
                setUpdateData({ ...updateData, proxy: { isUpdate: false, isExists: true, version: updateData.proxy.version } })
            }
        }
        setDownloadType(""); setIsDownloading(false)
    }

    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setIsOpenDownloadDataModal(false); setIsOpenUpdateDataModal(false); setIsOpenSelfUpdateModal(false); setIsOpenRegionModal(false) }
        }
        window.addEventListener('keydown', handleEscKey)
        return () => window.removeEventListener('keydown', handleEscKey)
    }, [isOpenDownloadDataModal, isOpenUpdateDataModal, isOpenSelfUpdateModal, isOpenRegionModal]);

    return (
        <div className="relative min-h-fit overflow-hidden">
            {/* Background */}
            <img
                src={background}
                alt="background"
                className="fixed inset-0 w-full h-full object-cover z-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "bg-17.jpg" }}
            />

            {/* Bottom vignette — only at the bottom for readability of action buttons */}
            <div className="fixed inset-x-0 bottom-0 h-40 z-1 pointer-events-none
                            bg-linear-to-t from-black/55 to-transparent" />

            {/* ── Right side panel: widget links + community + howto ── */}
            <div className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-10 flex-col gap-2">
                <div className="flex flex-col gap-1.5 bg-white/50 backdrop-blur-md border border-white/80 rounded-2xl p-1.5 shadow-lg shadow-pink-100/40">
                    {widgetLinks.map((link, idx) => (
                        <div key={idx} className="tooltip tooltip-left" data-tip={link.tooltip}>
                            <button
                                className="btn btn-circle btn-sm bg-transparent hover:bg-pink-100/60 border-none transition-all"
                                onClick={() => openExternal(link.href)}
                            >
                                <img src={link.img} alt={link.tooltip} className="w-5 h-5 rounded-full" />
                            </button>
                        </div>
                    ))}

                    <div className="w-full h-px bg-pink-200/40 my-0.5" />

                    {/* Discord community */}
                    <div className="tooltip tooltip-left" data-tip="Join our Discord">
                        <button
                            onClick={() => openExternal("https://discord.gg/castoriceps")}
                            className="btn btn-circle btn-sm bg-transparent hover:bg-[#5865F2]/15 border-none text-[#5865F2] transition-all"
                            aria-label="Discord"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                                <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.075.075 0 0 0-.079.037c-.21.371-.444.857-.608 1.234a18.27 18.27 0 0 0-5.487 0 12.78 12.78 0 0 0-.617-1.234.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 5.928 4.37a.07.07 0 0 0-.032.027C2.533 9.046 1.622 13.58 2.07 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.106c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .031-.056c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.175 1.094 2.157 2.418 0 1.334-.956 2.42-2.157 2.42zm7.974 0c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.42-2.157 2.42z"/>
                            </svg>
                        </button>
                    </div>

                    <div className="w-full h-px bg-pink-200/40 my-0.5" />

                    <div className="tooltip tooltip-left" data-tip={t("home.tooltip_how_to")}>
                        <Link
                            to="/howto"
                            className="btn btn-circle btn-sm bg-transparent hover:bg-pink-100/60 border-none text-base-content/60 hover:text-pink-500 transition-all"
                        >
                            <MessageCircleQuestionMark className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Background selector (always visible) ── */}
            <div className="hidden sm:flex fixed bottom-5 left-5 z-10">
                <BackgroundSelector />
            </div>

            {/* ── Bottom action bar (always visible) ── */}
            <div className="fixed bottom-5 right-5 z-10 flex items-center gap-2">
                {/* Menu */}
                <div className="dropdown dropdown-top dropdown-end">
                    <motion.div
                        tabIndex={0}
                        role="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-circle btn-md bg-white/80 backdrop-blur-md border border-pink-200/60 hover:bg-pink-50 text-base-content cursor-pointer shadow-md shadow-pink-100/40"
                    >
                        <Menu className="w-5 h-5" />
                    </motion.div>
                    <ul tabIndex={0} className="dropdown-content menu bg-white/95 backdrop-blur-xl border border-pink-100 rounded-2xl z-20 w-52 p-2 shadow-xl shadow-pink-100/50 mb-2">
                        <li><button onClick={handlePickFile}>{t("home.menu_change_path")}</button></li>
                        <li>
                            <button onClick={async () => {
                                if (launchMode === "march7thhoney") {
                                    if (!ensureRegion()) return
                                    const patchData = await CheckUpdatePatch(region, patchDllPath, patchDllVersion)
                                    setUpdateData({ ...updateData, patch: patchData })
                                    if (!patchData.isExists) { setIsOpenDownloadDataModal(true); return }
                                    if (patchData.isUpdate)  { setIsOpenUpdateDataModal(true);  return }
                                    toast.success(t("home.no_updates"))
                                    return
                                }
                                const serverData = await CheckUpdateServer(serverPath, serverVersion)
                                const proxyData  = await CheckUpdateProxy(proxyPath, proxyVersion)
                                setUpdateData({ ...updateData, server: serverData, proxy: proxyData })
                                if (!serverData.isExists || !proxyData.isExists) { setIsOpenDownloadDataModal(true); return }
                                if (serverData.isUpdate || proxyData.isUpdate)   { setIsOpenUpdateDataModal(true); return }
                                toast.success(t("home.no_updates"))
                            }}>{t("home.menu_check_update")}</button>
                        </li>
                        <li><button disabled={!serverPath} onClick={() => serverPath && FSService.OpenFolder("./server")}>{t("home.menu_open_server")}</button></li>
                        <li><button disabled={!proxyPath}  onClick={() => proxyPath  && FSService.OpenFolder("./proxy")} >{t("home.menu_open_proxy")}</button></li>
                        <li><button disabled={!gameDir}    onClick={() => gameDir    && FSService.OpenFolder(gameDir + "/StarRail_Data/Persistent/Audio/AudioPackage/Windows")}>{t("home.menu_open_voice")}</button></li>
                    </ul>
                </div>

                {/* Primary action button — always visible, behavior depends on state */}
                {isDownloading ? (
                    <button
                        disabled
                        className="btn btn-lg font-bold bg-linear-to-r from-pink-300 to-sky-300 border-none text-white/90 shadow-lg shadow-pink-200/50 cursor-not-allowed"
                    >
                        <Play className="w-5 h-5" />
                        {t("home.status_wait")}
                    </button>
                ) : (launchMode === "march7thhoney" ? !patchReady : (!serverReady || !proxyReady)) ? (
                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(244,114,182,0.45)' }}
                        whileTap={{ scale: 0.97 }}
                        className="btn btn-lg font-bold bg-linear-to-r from-pink-500 via-violet-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                        onClick={() => setIsOpenDownloadDataModal(true)}
                    >
                        <FolderOpen className="w-5 h-5" />
                        {t("home.btn_download")}
                    </motion.button>
                ) : gamePath === "" ? (
                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(244,114,182,0.45)' }}
                        whileTap={{ scale: 0.97 }}
                        className="btn btn-lg font-bold bg-linear-to-r from-pink-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                        onClick={handlePickFile}
                    >
                        <FolderOpen className="w-5 h-5" />
                        {isLoading ? t("home.btn_selecting") : t("home.btn_select_game")}
                    </motion.button>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(244,114,182,0.55)' }}
                        whileTap={{ scale: 0.97 }}
                        className="btn btn-lg font-bold bg-linear-to-r from-pink-500 via-violet-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                        onClick={handleStartGame}
                    >
                        <Play className="w-5 h-5" />
                        {isLoading ? t("home.btn_selecting") : gameRunning ? t("home.btn_game_running") : t("home.btn_start_game")}
                    </motion.button>
                )}
            </div>

            {/* ── Download progress ── */}
            {isDownloading && (
                updateData.proxy.isUpdate || updateData.server.isUpdate ||
                !updateData.proxy.isExists || !updateData.server.isExists
            ) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-[55vw] bg-white/80 backdrop-blur-xl border border-pink-200/60 rounded-2xl p-4 shadow-xl shadow-pink-100/50">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-base-content/50">{downloadType}</span>
                            <div className="flex gap-3">
                                <span className="text-sky-500 font-semibold">{downloadSpeed}</span>
                                <span className="text-base-content font-bold">{progressDownload.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="relative w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                className="h-full bg-linear-to-r from-pink-400 via-violet-400 to-sky-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressDownload}%` }}
                                transition={{ type: "tween", ease: "linear", duration: 0.03 }}
                            />
                            <motion.div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                            />
                        </div>
                        <p className="text-center text-xs text-base-content/40">
                            {progressDownload < 100 ? t("home.status_wait") : t("home.status_complete")}
                        </p>
                    </div>
                </div>
            )}

            {isDownloading && updateData.launcher.isUpdate && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-[55vw] bg-white/80 backdrop-blur-xl border border-pink-200/60 rounded-2xl p-4 shadow-xl shadow-pink-100/50 text-center">
                    {["update:launcher:downloading", "update:launcher:success", "update:launcher:failed"].includes(downloadType) && (
                        <span className={`font-bold text-xl ${
                            downloadType === "update:launcher:downloading" ? "text-yellow-200" :
                            downloadType === "update:launcher:success"    ? "text-emerald-300" : "text-red-300"
                        }`}>
                            {downloadType === "update:launcher:downloading" && t("home.status_updating_launcher")}
                            {downloadType === "update:launcher:success"    && t("home.status_update_success")}
                            {downloadType === "update:launcher:failed"     && t("home.status_update_failed")}
                        </span>
                    )}
                </div>
            )}

            {/* ── Modals ── */}
            <UpdateModal
                isOpen={isOpenUpdateDataModal}
                onClose={() => setIsOpenUpdateDataModal(false)}
                title={t("home.modal_update_title")}
                message={t("home.modal_update_msg")}
                buttons={[
                    { text: t("home.btn_no"),  onClick: () => setIsOpenUpdateDataModal(false), variant: "outline" },
                    { text: t("home.btn_yes"), onClick: async () => { setIsOpenUpdateDataModal(false); await handlerUpdateData() }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenDownloadDataModal}
                onClose={() => setIsOpenDownloadDataModal(false)}
                title={t("home.modal_download_title")}
                message={t("home.modal_download_msg")}
                buttons={[
                    { text: t("home.btn_download"), onClick: async () => { setIsOpenDownloadDataModal(false); await handlerUpdateData() }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenSelfUpdateModal}
                onClose={() => setIsOpenSelfUpdateModal(false)}
                title={t("home.modal_self_update_title")}
                message={t("home.modal_self_update_msg")}
                buttons={[
                    { text: t("home.btn_no"),  onClick: () => setIsOpenSelfUpdateModal(false), variant: "outline" },
                    { text: t("home.btn_yes"), onClick: async () => { setIsOpenSelfUpdateModal(false); await handlerUpdateData() }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenRegionModal}
                onClose={() => setIsOpenRegionModal(false)}
                title={t("home.modal_region_title")}
                message={t("home.modal_region_msg")}
                buttons={[
                    { text: t("home.btn_region_os"), onClick: () => { setRegion("os"); setIsOpenRegionModal(false); toast.success(t("home.toast_region_set", { region: "OS" })) }, variant: "primary" },
                    { text: t("home.btn_region_cn"), onClick: () => { setRegion("cn"); setIsOpenRegionModal(false); toast.success(t("home.toast_region_set", { region: "CN" })) }, variant: "primary" },
                ]}
            />
        </div>
    )
}
