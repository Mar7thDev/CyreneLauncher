import { useEffect, useRef, useState } from 'react';
import { Play, Menu, FolderOpen, MessageCircleQuestionMark, Download, PowerOff } from 'lucide-react';
import { AppService } from '@bindings/cyrene-launcher/internal/app-service';
import { FSService } from '@bindings/cyrene-launcher/internal/fs-service';
import { March7thHoneyService } from '@bindings/cyrene-launcher/internal/march7thhoney-service';
import { toast } from 'react-toastify';
import path from 'path-browserify'
import useSettingStore from '@/stores/settingStore';
import useModalStore from '@/stores/modalStore';
import useLauncherStore from '@/stores/launcherStore';
import useAccountStore from '@/stores/accountStore';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from '@tanstack/react-router';
import {
    CheckUpdateGenshinServer,
    CheckUpdateLauncher,
    GENSHIN_INJECTOR_PATH,
    GENSHIN_SERVER_MANIFEST,
    GENSHIN_SERVER_ROOT,
    sleep,
    UpdateGenshinServer,
    UpdateLauncher,
} from '@/helper';
import UpdateModal from '@/components/updateModal';
import { BackgroundSelector } from '@/components/backgroudModal';
import NewsWidget from '@/components/newsWidget';
import { useTranslation } from 'react-i18next';

const DEFAULT_PATCH_URL = "https://march7th.hoyotoon.com"
const LOCAL_TARGET_URL = "http://127.0.0.1:21000"

export default function LauncherPage() {
    const {
        gamePath, setGamePath, setGameDir,
        genshinGamePath, genshinGameDir, genshinServerDir, genshinServerVersion,
        setGenshinGamePath, setGenshinGameDir, setGenshinServerDir,
        gameDir, background, gameProfile,
        serverTarget, patchTargetUrl, proxyPort,
        rsaPatch, rsaKey, webRedirect, webHosts,
    } = useSettingStore()
    const { user, setSkipped } = useAccountStore()
    const { t } = useTranslation()
    const [visibleBackground, setVisibleBackground] = useState(background)
    const [isBackgroundBlackout, setIsBackgroundBlackout] = useState(false)
    const currentBackgroundRef = useRef(background)
    const backgroundTimerRef = useRef<number | null>(null)
    const {
        isOpenDownloadDataModal, isOpenUpdateDataModal, isOpenSelfUpdateModal,
        setIsOpenDownloadDataModal, setIsOpenUpdateDataModal, setIsOpenSelfUpdateModal,
    } = useModalStore()
    const {
        isLoading, downloadType, serverReady, isDownloading,
        serverRunning, gameRunning, progressDownload, downloadSpeed,
        updateData, setLauncherVersion, setIsLoading, setDownloadType,
        setServerReady, setPatchReady, setIsDownloading,
        setServerRunning, setGameRunning, setUpdateData,
    } = useLauncherStore()
    const isGenshin = gameProfile === "genshin"
    const isStarRail = gameProfile === "starrail"
    const genshinServerRoot = genshinServerDir || GENSHIN_SERVER_ROOT

    useEffect(() => {
        if (background === currentBackgroundRef.current) return
        if (backgroundTimerRef.current) {
            window.clearTimeout(backgroundTimerRef.current)
        }
        setIsBackgroundBlackout(true)
        backgroundTimerRef.current = window.setTimeout(() => {
            currentBackgroundRef.current = background
            setVisibleBackground(background)
            backgroundTimerRef.current = window.setTimeout(() => {
                setIsBackgroundBlackout(false)
                backgroundTimerRef.current = null
            }, 60)
        }, 320)
        return () => {
            if (backgroundTimerRef.current) {
                window.clearTimeout(backgroundTimerRef.current)
                backgroundTimerRef.current = null
            }
        }
    }, [background])

    const widgetLinks = gameProfile === "starrail"
        ? [
            { tooltip: "Firefly SRAnalysis", href: "https://sranalysis.punklorde.org", img: "https://sranalysis.punklorde.org/ff-sranalysis.png" },
            { tooltip: "Firefly SRTools",    href: "https://srtools.punklorde.org",    img: "https://srtools.punklorde.org/ff-srtool.png" },
            { tooltip: "Amazing's SRTools", href: "https://srtools.neonteam.dev",      img: "https://icons.duckduckgo.com/ip3/srtools.neonteam.dev.ico" },
        ]
        : []

    const openExternal = async (url: string) => {
        try { await AppService.OpenURL(url) }
        catch { window.open(url, "_blank") }
    }

    // Check if the Genshin server package exists on disk; Star Rail only needs a game path.
    useEffect(() => {
        const check = async () => {
            if (isGenshin) {
                const serverRoot = genshinServerDir || GENSHIN_SERVER_ROOT
                const manifestPath = genshinServerDir ? `${serverRoot}/cyrene-manifest.json` : GENSHIN_SERVER_MANIFEST
                const injectorPath = genshinServerDir ? `${serverRoot}/native/bin/YsrpgInjector.exe` : GENSHIN_INJECTOR_PATH
                setServerReady(await FSService.FileExists(manifestPath) && await FSService.FileExists(injectorPath))
                setServerRunning(await FSService.IsGenshinServerRunning())
                setPatchReady(genshinGamePath !== "")
                return
            }
            setPatchReady(gamePath !== "")
        }
        check()
    }, [isGenshin, gamePath, genshinGamePath, genshinServerDir])

    // Startup: check launcher update, then server/proxy updates.
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

            if (isGenshin) {
                const existsGenshinGame = await FSService.FileExists(genshinGamePath)
                if (!existsGenshinGame) {
                    setGameRunning(false)
                    setGenshinGamePath("")
                    setGenshinGameDir("")
                }
                const serverRoot = genshinServerDir || GENSHIN_SERVER_ROOT
                const manifestPath = genshinServerDir ? `${serverRoot}/cyrene-manifest.json` : GENSHIN_SERVER_MANIFEST
                const injectorPath = genshinServerDir ? `${serverRoot}/native/bin/YsrpgInjector.exe` : GENSHIN_INJECTOR_PATH
                const existsGenshinServer = await FSService.FileExists(manifestPath) && await FSService.FileExists(injectorPath)
                let genshinServerData = {
                    isUpdate: false,
                    isExists: existsGenshinServer,
                    version: genshinServerVersion,
                }
                if (existsGenshinServer) {
                    if (!genshinServerDir) {
                        setGenshinServerDir(GENSHIN_SERVER_ROOT)
                    }
                    genshinServerData = await CheckUpdateGenshinServer(genshinServerVersion)
                }
                setUpdateData({
                    server: genshinServerData,
                    proxy:  { isUpdate: false, isExists: true, version: "" },
                    patch:  { isUpdate: false, isExists: true, version: "" },
                    launcher: launcherData,
                })
                setServerReady(genshinServerData.isExists)
                setServerRunning(await FSService.IsGenshinServerRunning())
                setPatchReady(genshinGamePath !== "")
                if (genshinServerData.isUpdate) {
                    setIsOpenUpdateDataModal(true)
                }
                return
            }

            const exitGame = await FSService.FileExists(gamePath)
            if (!exitGame) { setGameRunning(false); setGamePath(""); setGameDir("") }

            // Star Rail proxy mode: no asset to download or update check.
            setUpdateData({
                server: { isUpdate: false, isExists: true, version: "" },
                proxy:  { isUpdate: false, isExists: true, version: "" },
                patch:  { isUpdate: false, isExists: true, version: "" },
                launcher: launcherData,
            })
            setPatchReady(gamePath !== "")
        }
        checkStartUp()
    }, [isGenshin]);

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

    const handlePickGenshinFile = async () => {
        try {
            setIsLoading(true)
            const folderPath = await FSService.PickFolder()
            if (!folderPath) return
            const normalized = folderPath.replace(/\\/g, '/')
            const gameExe = `${normalized}/YuanShen.exe`
            const gameDataDir = `${normalized}/YuanShen_Data`
            const exeExists = await FSService.FileExists(gameExe)
            const dataDirExists = await FSService.DirExists(gameDataDir)
            if (exeExists && dataDirExists) {
                setGenshinGamePath(gameExe)
                setGenshinGameDir(normalized)
                setPatchReady(true)
                toast.success(t("home.genshin_path_success"))
            } else { toast.error(t("home.error_genshin_file_type")) }
        } catch (err: any) { toast.error(t("home.toast_pick_folder_error"), err) }
        finally { setIsLoading(false) }
    }

    const handleStartGenshin = async () => {
        if (!genshinGamePath || gameRunning) return
        let startedServer = false
        try {
            setIsLoading(true)
            if (!serverRunning) {
                const [serverOk, serverErr] = await FSService.StartGenshinServer()
                if (!serverOk) { toast.error(t("home.toast_start_server_failed") + serverErr); return }
                setServerRunning(true)
                startedServer = true
                await sleep(1200)
                if (!useLauncherStore.getState().serverRunning) {
                    toast.error(t("home.toast_start_server_failed") + "server exited immediately")
                    return
                }
            }

            const [gameOk, gameErr] = await FSService.StartGenshinGame(genshinGamePath)
            if (!gameOk) {
                if (startedServer) {
                    await FSService.StopGenshinServer()
                    setServerRunning(false)
                }
                toast.error(t("home.toast_start_game_failed") + gameErr)
                return
            }
            setGameRunning(true)
        } catch (err: any) {
            toast.error(t("home.toast_start_game_error") + err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStopGenshinServer = async () => {
        if (!serverRunning) return
        try {
            const [ok, err] = await FSService.StopGenshinServer()
            if (!ok) { toast.error(t("home.toast_start_server_failed") + err); return }
            setServerRunning(false)
        } catch (err: any) {
            toast.error(t("home.toast_start_server_failed") + err)
        }
    }

    const handleStartGame = async () => {
        if (!gamePath || gameRunning) return
        try {
            setIsLoading(true)
            if (gamePath.endsWith("launcher.exe")) {
                toast.error(t("home.toast_march7th_needs_starrail"))
                return
            }

            let target = DEFAULT_PATCH_URL
            if (serverTarget === "custom") {
                target = patchTargetUrl || DEFAULT_PATCH_URL
            } else if (serverTarget === "local") {
                if (!user) {
                    toast.error(t("account.login_required"))
                    setSkipped(false)
                    return
                }
                const [sok, serr] = await March7thHoneyService.StartLocalServer()
                if (!sok) {
                    const msg =
                        serr === "not_logged_in" ? t("account.login_required") :
                        serr === "server_not_found" ? t("home.toast_local_server_missing") :
                        serr === "server_not_ready" ? t("home.toast_local_server_not_ready") :
                        t("home.toast_start_server_failed") + serr
                    toast.error(msg)
                    return
                }
                target = LOCAL_TARGET_URL
            }

            const [ok, err] = await March7thHoneyService.Start(gamePath, target, proxyPort, {
                rsaPatch, rsaKey, webRedirect, webHosts,
            })
            if (!ok) { toast.error(t("home.toast_start_game_failed") + err); return }
            setGameRunning(true)
        } catch (err: any) { toast.error(t("home.toast_start_game_error"), err) }
        finally { setIsLoading(false) }
    }

    const handleStartCurrentGame = async () => {
        if (isGenshin) {
            await handleStartGenshin()
            return
        }
        await handleStartGame()
    }

    const handlePickCurrentGameFile = async () => {
        if (isGenshin) {
            await handlePickGenshinFile()
            return
        }
        await handlePickFile()
    }

    const handleOpenServerFolder = async () => {
        const [ok, err] = await March7thHoneyService.OpenLocalServerFolder()
        if (ok) return
        const msg =
            err === "server_folder_missing" ? t("home.toast_server_folder_missing") :
            err === "server_folder_empty" ? t("home.toast_server_folder_empty") :
            t("home.toast_start_server_failed") + err
        toast.error(msg)
    }

    const handleOpenDownloadDataModal = async () => {
        if (isGenshin) {
            const serverData = await CheckUpdateGenshinServer(genshinServerVersion)
            if (!serverData.version) {
                toast.error("No Genshin server package was found in the GitHub release.")
                return
            }
            setUpdateData({
                ...updateData,
                server: serverData,
                proxy: { isUpdate: false, isExists: true, version: "" },
                patch: { isUpdate: false, isExists: true, version: "" },
            })
        }
        setIsOpenDownloadDataModal(true)
    }

    const handlerUpdateData = async () => {
        setIsDownloading(true)
        if (isGenshin) {
            try {
                let serverData = updateData.server
                if (!serverData.version) {
                    serverData = await CheckUpdateGenshinServer(genshinServerVersion)
                }
                if (!serverData.version) {
                    toast.error("No Genshin server package was found in the GitHub release.")
                    return
                }
                const ok = await UpdateGenshinServer(serverData.version)
                setServerReady(ok)
                if (ok) {
                    setUpdateData({
                        ...updateData,
                        server: { isUpdate: false, isExists: true, version: serverData.version },
                        proxy: { isUpdate: false, isExists: true, version: "" },
                        patch: { isUpdate: false, isExists: true, version: "" },
                    })
                }
            } catch (err: any) {
                toast.error("Genshin server package update failed: " + err)
            } finally {
                setDownloadType("")
                setIsDownloading(false)
            }
            return
        }
        if (updateData.launcher.isUpdate) {
            await UpdateLauncher(updateData.launcher.version)
            setUpdateData({ ...updateData, launcher: { isUpdate: false, isExists: true, version: updateData.launcher.version } })
            setIsOpenSelfUpdateModal(true)
        }
        setDownloadType(""); setIsDownloading(false)
    }

    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpenDownloadDataModal(false)
                setIsOpenUpdateDataModal(false)
                setIsOpenSelfUpdateModal(false)
            }
        }
        window.addEventListener('keydown', handleEscKey)
        return () => window.removeEventListener('keydown', handleEscKey)
    }, [isOpenDownloadDataModal, isOpenUpdateDataModal, isOpenSelfUpdateModal]);

    return (
        <div className="relative min-h-fit overflow-hidden">
            {/* Background */}
            <img
                src={visibleBackground}
                alt="background"
                className="fixed inset-0 w-full h-full object-cover z-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "bg-17.jpg" }}
            />

            <div
                className={`fixed inset-0 z-0 bg-black pointer-events-none transition-opacity duration-500 ease-in-out ${
                    isBackgroundBlackout ? "opacity-100" : "opacity-0"
                }`}
            />

            {/* Bottom vignette */}
            <div className="fixed inset-x-0 bottom-0 h-40 z-1 pointer-events-none
                            bg-linear-to-t from-black/55 to-transparent" />

            {/* Right side panel */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={gameProfile}
                    initial={{ x: 96, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 96, opacity: 0 }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-10 flex-col gap-2"
                >
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

                        {widgetLinks.length > 0 && (
                            <div className="w-full h-px bg-pink-200/40 my-0.5" />
                        )}

                        <div className="tooltip tooltip-left" data-tip="Join our Discord">
                            <button
                                onClick={() => openExternal("https://discord.gg/CyreneEchoes")}
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
                </motion.div>
            </AnimatePresence>

            {/* Bottom-left: server news + background selector */}
            <div className="hidden sm:flex fixed bottom-5 left-5 z-10 flex-col items-start gap-3">
                {isStarRail && <NewsWidget />}
                <BackgroundSelector />
            </div>

            {/* Bottom action bar */}
            <div className="fixed bottom-5 right-5 z-10 flex items-center gap-2">
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
                        <li>
                            <button onClick={handlePickCurrentGameFile}>
                                {isGenshin ? t("home.menu_change_genshin_path") : t("home.menu_change_path")}
                            </button>
                        </li>
                        {isStarRail && (
                            <>
                                <li><button disabled={!gameDir} onClick={() => gameDir && FSService.OpenFolder(gameDir + "/StarRail_Data/Persistent/Audio/AudioPackage/Windows")}>{t("home.menu_open_voice")}</button></li>
                                <li><button onClick={handleOpenServerFolder}>{t("home.menu_open_server")}</button></li>
                            </>
                        )}
                        {isGenshin && (
                            <>
                                <li><button disabled={!serverReady} onClick={() => serverReady && FSService.OpenFolder(genshinServerRoot)}>{t("home.menu_open_genshin_server")}</button></li>
                                <li><button disabled={!serverReady} onClick={() => serverReady && FSService.OpenFolder(`${genshinServerRoot}/data`)}>{t("home.menu_open_genshin_logs")}</button></li>
                                <li><button disabled={!genshinGameDir} onClick={() => genshinGameDir && FSService.OpenFolder(genshinGameDir)}>{t("home.menu_open_genshin_folder")}</button></li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Primary action button */}
                {isDownloading ? (
                    <button
                        disabled
                        className="btn btn-lg font-bold bg-linear-to-r from-pink-300 to-sky-300 border-none text-white/90 shadow-lg shadow-pink-200/50 cursor-not-allowed"
                    >
                        <Play className="w-5 h-5" />
                        {t("home.status_wait")}
                    </button>
                ) : isGenshin ? (
                    !serverReady ? (
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(244,114,182,0.45)' }}
                            whileTap={{ scale: 0.97 }}
                            className="btn btn-lg font-bold bg-linear-to-r from-pink-500 via-violet-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                            onClick={handleOpenDownloadDataModal}
                        >
                            <Download className="w-5 h-5" />
                            {t("home.btn_download")}
                        </motion.button>
                    ) : serverRunning ? (
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(244,63,94,0.42)' }}
                            whileTap={{ scale: 0.97 }}
                            className="btn btn-lg font-bold bg-linear-to-r from-rose-500 via-orange-500 to-pink-500 border-none text-white shadow-lg shadow-rose-300/50"
                            onClick={handleStopGenshinServer}
                            title={t("home.tip_close_genshin_server")}
                            aria-label={t("home.tip_close_genshin_server")}
                        >
                            <PowerOff className="w-5 h-5" />
                            {t("home.btn_close_server")}
                        </motion.button>
                    ) : genshinGamePath === "" ? (
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(244,114,182,0.45)' }}
                            whileTap={{ scale: 0.97 }}
                            className="btn btn-lg font-bold bg-linear-to-r from-pink-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                            onClick={handlePickGenshinFile}
                        >
                            <FolderOpen className="w-5 h-5" />
                            {isLoading ? t("home.btn_selecting") : t("home.btn_select_genshin")}
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(244,114,182,0.55)' }}
                            whileTap={{ scale: 0.97 }}
                            className="btn btn-lg font-bold bg-linear-to-r from-pink-500 via-violet-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                            onClick={handleStartCurrentGame}
                        >
                            <Play className="w-5 h-5" />
                            {isLoading ? t("home.btn_selecting") : gameRunning ? t("home.btn_game_running") : t("home.btn_start_genshin")}
                        </motion.button>
                    )
                ) : gamePath === "" ? (
                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(244,114,182,0.45)' }}
                        whileTap={{ scale: 0.97 }}
                        className="btn btn-lg font-bold bg-linear-to-r from-pink-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                        onClick={handlePickCurrentGameFile}
                    >
                        <FolderOpen className="w-5 h-5" />
                        {isLoading ? t("home.btn_selecting") : t("home.btn_select_game")}
                    </motion.button>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(244,114,182,0.55)' }}
                        whileTap={{ scale: 0.97 }}
                        className="btn btn-lg font-bold bg-linear-to-r from-pink-500 via-violet-500 to-sky-500 border-none text-white shadow-lg shadow-pink-300/50"
                        onClick={handleStartCurrentGame}
                    >
                        <Play className="w-5 h-5" />
                        {isLoading ? t("home.btn_selecting") : gameRunning ? t("home.btn_game_running") : t("home.btn_start_game")}
                    </motion.button>
                )}
            </div>

            {/* Download progress */}
            {isDownloading && !updateData.launcher.isUpdate && isGenshin && (
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

            {/* Modals */}
            <UpdateModal
                isOpen={isOpenUpdateDataModal}
                onClose={() => setIsOpenUpdateDataModal(false)}
                title={isGenshin ? t("home.modal_genshin_update_title") : t("home.modal_update_title")}
                message={isGenshin ? t("home.modal_genshin_update_msg") : t("home.modal_update_msg")}
                buttons={[
                    { text: t("home.btn_no"),  onClick: () => setIsOpenUpdateDataModal(false), variant: "outline" },
                    { text: t("home.btn_yes"), onClick: async () => { setIsOpenUpdateDataModal(false); await handlerUpdateData() }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenDownloadDataModal}
                onClose={() => setIsOpenDownloadDataModal(false)}
                title={isGenshin ? t("home.modal_genshin_download_title") : t("home.modal_download_title")}
                message={isGenshin ? t("home.modal_genshin_download_msg") : t("home.modal_download_msg")}
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
        </div>
    )
}
