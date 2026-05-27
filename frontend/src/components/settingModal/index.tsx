import { CheckUpdateLauncher } from "@/helper"
import useModalStore from "@/stores/modalStore"
import useSettingStore, { type ServerSource, type LaunchMode } from "@/stores/settingStore"
import useLauncherStore from "@/stores/launcherStore"
import { toast } from "react-toastify"
import { useTranslation } from "react-i18next"
import { ExternalLink, Server, ServerCog, Rocket, Syringe } from "lucide-react"

const PROJECT_NAME = "Cyrene Launcher"
const PROJECT_AUTHOR = "Firefly Shelter (original) · Cyrene (fork)"
const PROJECT_REPO_URL = "https://github.com/Mar7thDev/CyreneLauncher"
const DEFAULT_PATCH_URL = "https://march7th.hoyotoon.com"

export default function SettingModal({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    if (!isOpen) return null
    const { t } = useTranslation()
    const { setIsOpenSelfUpdateModal } = useModalStore()
    const {
        closingOption, setClosingOption,
        serverVersion, proxyVersion,
        serverSource, setServerSource,
        launchMode, setLaunchMode,
        patchTargetUrl, setPatchTargetUrl,
        rsaPatch, setRsaPatch, rsaKey, setRsaKey,
        webRedirect, setWebRedirect, webHosts, setWebHosts,
    } = useSettingStore()
    const { setUpdateData, updateData, launcherVersion } = useLauncherStore()

    const handleSourceChange = (next: ServerSource) => {
        if (next === serverSource) return
        setServerSource(next)
        toast.success(t("setting.source_switched", { name: t(`setting.source_${next}`) }))
    }

    const handleLaunchModeChange = (next: LaunchMode) => {
        if (next === launchMode) return
        setLaunchMode(next)
        toast.success(t("setting.launch_mode_switched", { name: t(`setting.launch_mode_${next}`) }))
    }

    const CheckUpdate = async () => {
        const launcherData = await CheckUpdateLauncher()
        if (!launcherData.isUpdate) {
            toast.success(t("setting.launcher_update_success"))
            return
        }
        setUpdateData({
            server: updateData.server,
            proxy: updateData.proxy,
            patch: updateData.patch,
            launcher: launcherData
        })
        setIsOpenSelfUpdateModal(true)
    }

    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-pink-50/30 backdrop-blur-md">
            <div className="relative w-[90%] max-w-md bg-white/95 backdrop-blur-xl text-base-content rounded-2xl border border-pink-200/60 shadow-2xl shadow-pink-200/40 p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-2xl text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-sky-500">
                        {t("setting.title")}
                    </h3>
                    <button
                        className="btn btn-circle btn-sm bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-400"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Launch Mode */}
                    <div className="p-4 bg-base-200 rounded-xl border border-violet-200/50">
                        <h4 className="font-bold text-base mb-1">{t("setting.launch_mode_title")}</h4>
                        <p className="text-sm text-base-content/50 mb-3">{t("setting.launch_mode_desc")}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {(["fireflygo", "march7thhoney"] as LaunchMode[]).map(opt => {
                                const isActive = launchMode === opt
                                const Icon = opt === "fireflygo" ? Rocket : Syringe
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => handleLaunchModeChange(opt)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                                            isActive
                                                ? "bg-linear-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-md shadow-violet-200/50"
                                                : "bg-white hover:bg-violet-50 border-violet-200/60 text-base-content/70 hover:text-violet-500"
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span className="flex-1">{t(`setting.launch_mode_${opt}`)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* FireflyGo: Server Source */}
                    {launchMode === "fireflygo" && (
                    <div className="p-4 bg-base-200 rounded-xl border border-sky-200/50">
                        <h4 className="font-bold text-base mb-1">{t("setting.source_title")}</h4>
                        <p className="text-sm text-base-content/50 mb-3">{t("setting.source_desc")}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {(["firefly", "custom"] as ServerSource[]).map(opt => {
                                const isActive = serverSource === opt
                                const Icon = opt === "firefly" ? Server : ServerCog
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => handleSourceChange(opt)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                                            isActive
                                                ? "bg-linear-to-r from-pink-500 to-sky-500 text-white border-transparent shadow-md shadow-pink-200/50"
                                                : "bg-white hover:bg-pink-50 border-pink-200/60 text-base-content/70 hover:text-pink-500"
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span className="flex-1">{t(`setting.source_${opt}`)}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-xs text-base-content/40 mt-2">{t("setting.source_hint")}</p>
                    </div>
                    )}

                    {/* March7thHoney options */}
                    {launchMode === "march7thhoney" && (
                    <div className="p-4 bg-base-200 rounded-xl border border-violet-200/50 flex flex-col gap-4">
                        {/* Server URL */}
                        <div>
                            <h4 className="font-bold text-base mb-1">{t("setting.patch_url_title")}</h4>
                            <p className="text-sm text-base-content/50 mb-2">{t("setting.patch_url_desc")}</p>
                            <input
                                type="text"
                                className="input input-sm w-full bg-white border border-violet-200/60 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                                placeholder={DEFAULT_PATCH_URL}
                                value={patchTargetUrl}
                                onChange={e => setPatchTargetUrl(e.target.value)}
                            />
                            <p className="text-xs text-base-content/40 mt-1">{t("setting.patch_url_hint")}</p>
                        </div>

                        {/* RSA Patch */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-xs toggle-primary"
                                    checked={rsaPatch}
                                    onChange={e => setRsaPatch(e.target.checked)}
                                />
                                <span className="text-sm font-medium">{t("setting.rsa_patch_title")}</span>
                            </label>
                            {rsaPatch && (
                                <textarea
                                    className="textarea textarea-sm w-full bg-white border border-violet-200/60 rounded-lg text-xs font-mono focus:outline-none focus:border-violet-400 resize-none"
                                    rows={3}
                                    placeholder={t("setting.rsa_key_hint")}
                                    value={rsaKey}
                                    onChange={e => setRsaKey(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Webpage Redirect */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-xs toggle-primary"
                                    checked={webRedirect}
                                    onChange={e => setWebRedirect(e.target.checked)}
                                />
                                <span className="text-sm font-medium">{t("setting.web_redirect_title")}</span>
                            </label>
                            {webRedirect && (
                                <textarea
                                    className="textarea textarea-sm w-full bg-white border border-violet-200/60 rounded-lg text-xs font-mono focus:outline-none focus:border-violet-400 resize-none"
                                    rows={4}
                                    placeholder={t("setting.web_hosts_hint")}
                                    value={webHosts}
                                    onChange={e => setWebHosts(e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                    )}

                    {/* Launcher Update */}
                    <div className="p-4 bg-base-200 rounded-xl border border-pink-200/50">
                        <h4 className="font-bold text-base mb-1">{t("setting.launcher_update_title")}</h4>
                        <p className="text-sm text-base-content/50 mb-3">{t("setting.launcher_update_desc")}</p>
                        <button
                            className="btn btn-sm bg-linear-to-r from-pink-500 to-sky-500 border-none text-white shadow-sm hover:shadow-pink-200/60 transition-shadow"
                            onClick={CheckUpdate}
                        >
                            {t("setting.launcher_update_btn")}
                        </button>
                    </div>

                    {/* Closing Option */}
                    <div className="p-4 bg-base-200 rounded-xl border border-pink-200/50">
                        <h4 className="font-bold text-base mb-3">{t("setting.closing_options_title")}</h4>
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary checkbox-sm mt-0.5"
                                checked={!closingOption.isAsk}
                                onChange={(e) => {
                                    setClosingOption({
                                        isMinimize: closingOption.isMinimize,
                                        isAsk: !e.target.checked
                                    })
                                }}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{t("setting.set_dont_ask_again")}</span>
                                <span className="text-xs text-base-content/50 mt-0.5">
                                    {t('setting.closing_auto_desc', { action: closingOption.isMinimize ? t('setting.action_minimize') : t('setting.action_quit') })}
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Version Info */}
                    <div className="p-4 bg-base-200 rounded-xl border border-pink-200/50">
                        <h4 className="font-bold text-base mb-3">{t("setting.version_label")}</h4>
                        <div className="flex flex-wrap gap-2">
                            {launchMode === "fireflygo" && (
                                <>
                                    <span className="badge badge-outline badge-primary text-xs">
                                        {t("setting.server_label")}: {serverVersion}
                                    </span>
                                    <span className="badge badge-outline badge-secondary text-xs">
                                        {t("setting.proxy_label")}: {proxyVersion}
                                    </span>
                                </>
                            )}
                            <span className="badge badge-outline badge-accent text-xs">
                                {t("setting.launcher_label")}: {launcherVersion}
                            </span>
                        </div>
                    </div>

                    {/* About */}
                    <div className="p-4 bg-base-200 rounded-xl border border-sky-200/50">
                        <h4 className="font-bold text-base mb-3">{t("setting.about_title")}</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-base-content/60">{t("setting.project_label")}</span>
                                <span className="font-semibold text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-sky-500">{PROJECT_NAME}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-base-content/60">{t("setting.author_label")}</span>
                                <span className="font-medium text-right text-xs">{PROJECT_AUTHOR}</span>
                            </div>
                            <a
                                href={PROJECT_REPO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-white hover:bg-pink-50 border border-pink-200 hover:border-pink-300 rounded-lg text-sm text-base-content/80 hover:text-pink-500 transition-all"
                            >
                                <ExternalLink size={16} />
                                <span>{t("setting.repo_link")}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
