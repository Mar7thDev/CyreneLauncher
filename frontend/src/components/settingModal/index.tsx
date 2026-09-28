import { CheckUpdateLauncher } from "@/helper"
import useModalStore from "@/stores/modalStore"
import useSettingStore, { normalizeServerUrl, SERVER_CHANNELS } from "@/stores/settingStore"
import useLauncherStore from "@/stores/launcherStore"
import { toast } from "react-toastify"
import { useTranslation } from "react-i18next"
import { Check, ExternalLink, Link2, MapPin } from "lucide-react"

const PROJECT_NAME = "Cyrene Launcher"
const PROJECT_AUTHOR = "Firefly Shelter (original) · Cyrene (fork)"
const PROJECT_REPO_URL = "https://git.kain.io.vn/Firefly-Shelter/Firefly_Launcher"

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
        serverTarget, setServerTarget, customServerUrl, setCustomServerUrl,
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
                                    <div className="flex flex-col gap-2" role="radiogroup">
                                        {SERVER_CHANNELS.map(channel => {
                                            const active = serverTarget === channel.id
                                            return (
                                                <button
                                                    key={channel.id}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={active}
                                                    onClick={() => setServerTarget(channel.id)}
                                                    className={`flex items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${active
                                                        ? "border-violet-400 bg-violet-50"
                                                        : "border-violet-200/60 bg-white hover:bg-violet-50/50"}`}
                                                >
                                                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-violet-500 bg-violet-500 text-white" : "border-violet-300"}`}>
                                                        {active && <Check size={11} strokeWidth={3} />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                            {t(`setting.server_target_${channel.id}`)}
                                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                                                                <MapPin size={10} />
                                                                {t(`setting.server_region_${channel.region}`)}
                                                            </span>
                                                        </span>
                                                        <span className="block text-xs text-base-content/50">{t(`setting.server_hint_${channel.id}`)}</span>
                                                    </span>
                                                </button>
                                            )
                                        })}
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={serverTarget === "custom"}
                                            onClick={() => setServerTarget("custom")}
                                            className={`flex items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${serverTarget === "custom"
                                                ? "border-violet-400 bg-violet-50"
                                                : "border-violet-200/60 bg-white hover:bg-violet-50/50"}`}
                                        >
                                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${serverTarget === "custom" ? "border-violet-500 bg-violet-500 text-white" : "border-violet-300"}`}>
                                                {serverTarget === "custom" && <Check size={11} strokeWidth={3} />}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    {t("setting.server_target_custom")}
                                                    <Link2 size={12} className="text-violet-400" />
                                                </span>
                                                <span className="block text-xs text-base-content/50">{t("setting.server_hint_custom")}</span>
                                            </span>
                                        </button>
                                        {serverTarget === "custom" && (
                                            <div>
                                                <input
                                                    type="text"
                                                    spellCheck={false}
                                                    className={`input input-sm w-full bg-white border rounded-lg text-sm focus:outline-none ${customServerUrl.trim() && !normalizeServerUrl(customServerUrl)
                                                        ? "border-red-300 focus:border-red-400"
                                                        : "border-violet-200/60 focus:border-violet-400"}`}
                                                    placeholder="http://127.0.0.1:21000"
                                                    value={customServerUrl}
                                                    onChange={e => setCustomServerUrl(e.target.value)}
                                                />
                                                {!normalizeServerUrl(customServerUrl) && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {customServerUrl.trim() ? t("setting.server_custom_invalid") : t("setting.server_custom_empty")}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-base-content/40 mt-1">{t("setting.patch_url_hint")}</p>
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
