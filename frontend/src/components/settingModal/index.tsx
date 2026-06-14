import { CheckUpdateLauncher } from "@/helper"
import useModalStore from "@/stores/modalStore"
import useSettingStore from "@/stores/settingStore"
import useLauncherStore from "@/stores/launcherStore"
import { toast } from "react-toastify"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { launcherConfig } from "@/config/launcher"

const PROJECT_NAME = launcherConfig.appName
const PROJECT_AUTHOR = launcherConfig.projectAuthor
const PROJECT_REPO_URL = launcherConfig.projectRepoUrl
const DEFAULT_PATCH_URL = launcherConfig.defaultPatchUrl

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
        patchTargetUrl, setPatchTargetUrl,
        patchServerPort, setPatchServerPort,
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
        <div className="fixed inset-0 z-10 flex items-center justify-center launcher-themed-overlay">
            <div className="relative w-[90%] max-w-md launcher-card text-base-content rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-2xl text-transparent bg-clip-text launcher-gradient-text">
                        {t("setting.title")}
                    </h3>
                    <button
                        className="btn btn-circle btn-sm launcher-soft-button"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {gameProfile === "genshin" ? (
                        <div className="p-4 launcher-setting-section rounded-xl">
                            <h4 className="font-bold text-base mb-1 launcher-setting-title">{t("setting.genshin_settings_title")}</h4>
                            <p className="text-sm launcher-setting-muted">{t("setting.genshin_settings_empty")}</p>
                        </div>
                    ) : (
                        <>
                            {/* Star Rail patch options */}
                            <div className="p-4 launcher-setting-section rounded-xl flex flex-col gap-4">
                                <div>
                                    <h4 className="font-bold text-base mb-1 launcher-setting-title">{t("setting.patch_url_title")}</h4>
                                    <p className="text-sm launcher-setting-muted mb-2">{t("setting.patch_url_desc")}</p>
                                    <input
                                        type="text"
                                        className="input input-sm w-full launcher-input rounded-lg text-sm"
                                        placeholder={DEFAULT_PATCH_URL}
                                        value={patchTargetUrl}
                                        onChange={e => setPatchTargetUrl(e.target.value)}
                                    />
                                    <p className="text-xs launcher-setting-muted mt-1">{t("setting.patch_url_hint")}</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-base mb-1 launcher-setting-title">{t("setting.patch_server_port_title")}</h4>
                                    <p className="text-sm launcher-setting-muted mb-2">{t("setting.patch_server_port_desc")}</p>
                                    <input
                                        type="number"
                                        min={0}
                                        max={65535}
                                        className="input input-sm w-full launcher-input rounded-lg text-sm"
                                        placeholder={launcherConfig.defaultPatchServerPort ? String(launcherConfig.defaultPatchServerPort) : t("setting.patch_server_port_placeholder")}
                                        value={patchServerPort || ""}
                                        onChange={e => setPatchServerPort(Math.max(0, Math.min(65535, parseInt(e.target.value, 10) || 0)))}
                                    />
                                    <p className="text-xs launcher-setting-muted mt-1">{t("setting.patch_server_port_hint")}</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-base mb-1 launcher-setting-title">{t("setting.proxy_port_title")}</h4>
                                    <p className="text-sm launcher-setting-muted mb-2">{t("setting.proxy_port_desc")}</p>
                                    <input
                                        type="number"
                                        min={0}
                                        max={65535}
                                        className="input input-sm w-full launcher-input rounded-lg text-sm"
                                        placeholder="8080"
                                        value={proxyPort || ""}
                                        onChange={e => setProxyPort(Math.max(0, Math.min(65535, parseInt(e.target.value, 10) || 0)))}
                                    />
                                    <p className="text-xs launcher-setting-muted mt-1">{t("setting.proxy_port_hint")}</p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-xs toggle-primary"
                                            checked={rsaPatch}
                                            onChange={e => setRsaPatch(e.target.checked)}
                                        />
                                        <span className="text-sm font-medium launcher-setting-title">{t("setting.rsa_patch_title")}</span>
                                    </label>
                                    {rsaPatch && (
                                        <textarea
                                            className="textarea textarea-sm w-full launcher-input rounded-lg text-xs font-mono resize-none"
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
                                        <span className="text-sm font-medium launcher-setting-title">{t("setting.web_redirect_title")}</span>
                                    </label>
                                    {webRedirect && (
                                        <textarea
                                            className="textarea textarea-sm w-full launcher-input rounded-lg text-xs font-mono resize-none"
                                            rows={4}
                                            placeholder={t("setting.web_hosts_hint")}
                                            value={webHosts}
                                            onChange={e => setWebHosts(e.target.value)}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Launcher Update */}
                            <div className="p-4 launcher-setting-section rounded-xl">
                                <h4 className="font-bold text-base mb-1 launcher-setting-title">{t("setting.launcher_update_title")}</h4>
                                <p className="text-sm launcher-setting-muted mb-3">{t("setting.launcher_update_desc")}</p>
                                <button
                                    className="btn btn-sm launcher-gradient border-none text-white launcher-gradient-shadow transition-shadow"
                                    onClick={CheckUpdate}
                                >
                                    {t("setting.launcher_update_btn")}
                                </button>
                            </div>

                            {/* Closing Option */}
                            <div className="p-4 launcher-setting-section rounded-xl">
                                <h4 className="font-bold text-base mb-3 launcher-setting-title">{t("setting.closing_options_title")}</h4>
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
                                        <span className="text-sm font-medium launcher-setting-title">{t("setting.set_dont_ask_again")}</span>
                                        <span className="text-xs launcher-setting-muted mt-0.5">
                                            {t('setting.closing_auto_desc', { action: closingOption.isMinimize ? t('setting.action_minimize') : t('setting.action_quit') })}
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* Version Info */}
                            <div className="p-4 launcher-setting-section rounded-xl">
                                <h4 className="font-bold text-base mb-3 launcher-setting-title">{t("setting.version_label")}</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="badge badge-outline launcher-setting-badge text-xs">
                                        {t("setting.launcher_label")}: {launcherVersion}
                                    </span>
                                </div>
                            </div>

                            {/* About */}
                            <div className="p-4 launcher-setting-section rounded-xl">
                                <h4 className="font-bold text-base mb-3 launcher-setting-title">{t("setting.about_title")}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="launcher-setting-muted">{t("setting.project_label")}</span>
                                        <span className="font-semibold text-transparent bg-clip-text launcher-gradient-text">{PROJECT_NAME}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="launcher-setting-muted">{t("setting.author_label")}</span>
                                        <span className="font-medium text-right text-xs launcher-setting-title">{PROJECT_AUTHOR}</span>
                                    </div>
                                    <a
                                        href={PROJECT_REPO_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 mt-3 px-3 py-2 launcher-outline-button rounded-lg text-sm transition-all"
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
