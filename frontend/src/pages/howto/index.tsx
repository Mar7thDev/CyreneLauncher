import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export default function HowToPage() {
    const { t } = useTranslation();

    return (
        <div className="launcher-tool-page min-h-screen flex items-center justify-center p-6">
            <div className="w-full launcher-tool-shell rounded-2xl p-8 space-y-8">
                <div className="flex flex-col items-center gap-3">
                    <h1 className="text-4xl font-bold launcher-tool-title text-center">{t("howto.title")}</h1>
                </div>

                {/* ── Section 1: General features ── */}
                <div className="launcher-info-panel border-l-4 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <span>🚀</span>
                        <span>{t("howto.sect1_title")}</span>
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">🎮</div>
                            <p>{t("howto.sect1_launch_game")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">🌐</div>
                            <p>{t("howto.sect1_lang_pre")} <Link to="/language" className="link link-info font-mono">{t("howto.sect1_lang_link")}</Link></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-2xl">📦</div>
                            <div>
                                <p className="launcher-setting-title font-semibold">{t("howto.sect1_patch_title")}</p>
                                <p>
                                    {t("howto.sect1_patch_desc_1_pre")} <Link to="/diff" className="link link-info font-mono">{t("howto.sect1_patch_desc_1_link")}</Link> {t("howto.sect1_patch_desc_1_post")}
                                </p>
                                <p className="mt-1">
                                    {t("howto.sect1_patch_desc_2_pre")} <span className="font-semibold">Hdiff</span>, <span className="font-semibold">Ldiff</span>{t("howto.sect1_patch_desc_2_post")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: March7thHoney proxy guide ── */}
                <div className="launcher-info-panel border-l-4 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <span>🛡️</span>
                        <span>{t("howto.m7h_title")}</span>
                    </h2>

                    <p className="mb-6">{t("howto.m7h_desc")}</p>

                    {/* Setup steps */}
                    <div className="launcher-info-card rounded-lg p-4 mb-4">
                        <h3 className="font-semibold mb-3">📋 {t("howto.m7h_steps_title")}</h3>
                        <ol className="space-y-2 text-sm list-none">
                            {[
                                t("howto.m7h_step1"),
                                t("howto.m7h_step2"),
                                t("howto.m7h_step3"),
                                t("howto.m7h_step4"),
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full launcher-step-index text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Proxy feature list */}
                    <div className="launcher-info-card rounded-lg p-4 mb-4">
                        <h3 className="font-semibold mb-3">⚙️ {t("howto.m7h_proxy_title")}</h3>
                        <ul className="space-y-2 text-sm">
                            {[
                                { icon: "🔐", text: t("howto.m7h_proxy_ca") },
                                { icon: "🔑", text: t("howto.m7h_proxy_rsa") },
                                { icon: "🔗", text: t("howto.m7h_proxy_url") },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span>{item.icon}</span>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <div className="launcher-status-warning rounded-lg p-3 flex items-start gap-2 text-sm">
                            <span>⚠️</span>
                            <span>{t("howto.m7h_note_admin")}</span>
                        </div>
                        <div className="launcher-info-card rounded-lg p-3 flex items-start gap-2 text-sm">
                            <span>💡</span>
                            <span>{t("howto.m7h_note_antivirus")}</span>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Other notes ── */}
                <div className="launcher-info-panel border-l-4 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <span>📌</span>
                        <span>{t("howto.sect3_title")}</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="launcher-status-warning rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-xl">⚠️</div>
                                <div>
                                    <h3 className="font-semibold mb-1">{t("howto.sect3_admin_title")}</h3>
                                    <p>{t("howto.sect3_admin_desc")}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="text-center pt-4">
                    <Link to="/" className="btn launcher-tool-button btn-wide">{t("howto.btn_back")}</Link>
                </div>
            </div>
        </div>
    );
}
