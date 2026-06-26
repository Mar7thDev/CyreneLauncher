import { CheckUpdateLauncher } from "@/helper"
import useModalStore from "@/stores/modalStore"
import useSettingStore, { type ServerTarget } from "@/stores/settingStore"
import useLauncherStore from "@/stores/launcherStore"
import { toast } from "react-toastify"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"

const PROJECT_NAME = "Cyrene Launcher"
const PROJECT_AUTHOR = "Firefly Shelter (original) · Cyrene (fork)"
const PROJECT_REPO_URL = "https://git.kain.io.vn/Firefly-Shelter/Firefly_Launcher"
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
        gameProfile,
        serverTarget, setServerTarget,
        patchTargetUrl, setPatchTargetUrl,
        proxyPort, setProxyPort,
        rsaPatch, setRsaPatch, rsaKey, setRsaKey,
        webRedirect, setWebRedirect, webHosts, setWebHosts,
    } = useSettingStore()
    const { setUpdateData, updateData, launcherVersion } = useLauncherStore()

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
                    {gameProfile === "genshin" ? (
                        <div className="p-4 bg-base-200 rounded-xl border border-violet-200/50">
                            <h4 className="font-bold text-base mb-1">{t("setting.genshin_settings_title")}</h4>
                            <p className="text-sm text-base-content/50">{t("setting.genshin_settings_empty")}</p>
                        </div>
                    ) : (
                        <>
                            {/* Star Rail patch options */}
                            <div className="p-4 bg-base-200 rounded-xl border border-violet-200/50 flex flex-col gap-4">
                                <div>
                                    <h4 className="font-bold text-base mb-1">{t("setting.patch_url_title")}</h4>
                                    <p className="text-sm text-base-content/50 mb-2">{t("setting.patch_url_desc")}</p>
                                    <select
                                        className="select select-sm w-full bg-white border border-violet-200/60 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                                        value={serverTarget}
                                        onChange={e => setServerTarget(e.target.value as ServerTarget)}
                                    >
                                        <option value="hoyotoon">{t("setting.server_target_hoyotoon")}</option>
                                        <option value="local">{t("setting.server_target_local")}</option>
                                        <option value="custom">{t("setting.server_target_custom")}</option>
                                    </select>
                                    {serverTarget === "custom" && (
                                        <input
                                            type="text"
                                            className="input input-sm w-full mt-2 bg-white border border-violet-200/60 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                                            placeholder={DEFAULT_PATCH_URL}
                                            value={patchTargetUrl}
                                            onChange={e => setPatchTargetUrl(e.target.value)}
                                        />
                                    )}
                                    <p className="text-xs text-base-content/40 mt-1">
                                        {serverTarget === "local" ? t("setting.server_target_local_hint") : t("setting.patch_url_hint")}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-base mb-1">{t("setting.proxy_port_title")}</h4>
                                    <p className="text-sm text-base-content/50 mb-2">{t("setting.proxy_port_desc")}</p>
                                    <input
                                        type="number"
                                        min={0}
                                        max={65535}
                                        className="input input-sm w-full bg-white border border-violet-200/60 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                                        placeholder="8080"
                                        value={proxyPort || ""}
                                        onChange={e => setProxyPort(Math.max(0, Math.min(65535, parseInt(e.target.value, 10) || 0)))}
                                    />
                                    <p className="text-xs text-base-content/40 mt-1">{t("setting.proxy_port_hint")}</p>
                                </div>

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
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
