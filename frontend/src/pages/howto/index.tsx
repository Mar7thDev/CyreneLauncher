import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export default function HowToPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className="w-full bg-base-100 shadow-xl rounded-2xl p-8 space-y-8">
                <div className="flex flex-col items-center gap-3">
                    <h1 className="text-4xl font-bold text-primary text-center">{t("howto.title")}</h1>
                </div>

                {/* ── Section 1: General features ── */}
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2 mb-4">
                        <span>🚀</span>
                        <span>{t("howto.sect1_title")}</span>
                    </h2>
                    <div className="space-y-3 text-green-700">
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">🎮</div>
                            <p>{t("howto.sect1_launch_game")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">🌐</div>
                            <p>{t("howto.sect1_lang_pre")} <Link to="/language" className="link link-info font-mono">{t("howto.sect1_lang_link")}</Link></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-2xl">📦</div>
                            <div>
                                <p className="text-green-800 font-semibold">{t("howto.sect1_patch_title")}</p>
                                <p className="text-green-700">
                                    {t("howto.sect1_patch_desc_1_pre")} <Link to="/diff" className="link link-info font-mono">{t("howto.sect1_patch_desc_1_link")}</Link> {t("howto.sect1_patch_desc_1_post")}
                                </p>
                                <p className="text-green-700 mt-1">
                                    {t("howto.sect1_patch_desc_2_pre")} <span className="font-semibold">Hdiff</span>, <span className="font-semibold">Ldiff</span>{t("howto.sect1_patch_desc_2_post")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: March7thHoney proxy guide ── */}
                <div className="bg-violet-50 border-l-4 border-violet-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-violet-800 flex items-center gap-2 mb-4">
                        <span>🛡️</span>
                        <span>{t("howto.m7h_title")}</span>
                    </h2>

                    <p className="text-violet-700 mb-6">{t("howto.m7h_desc")}</p>

                    {/* Setup steps */}
                    <div className="bg-white border border-violet-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-violet-800 mb-3">📋 {t("howto.m7h_steps_title")}</h3>
                        <ol className="space-y-2 text-violet-700 text-sm list-none">
                            {[
                                t("howto.m7h_step1"),
                                t("howto.m7h_step2"),
                                t("howto.m7h_step3"),
                                t("howto.m7h_step4"),
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Proxy feature list */}
                    <div className="bg-white border border-violet-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-violet-800 mb-3">⚙️ {t("howto.m7h_proxy_title")}</h3>
                        <ul className="space-y-2 text-violet-700 text-sm">
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 text-sm text-yellow-800">
                            <span>⚠️</span>
                            <span>{t("howto.m7h_note_admin")}</span>
                        </div>
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-start gap-2 text-sm text-sky-800">
                            <span>💡</span>
                            <span>{t("howto.m7h_note_antivirus")}</span>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Other notes ── */}
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <span>📌</span>
                        <span>{t("howto.sect3_title")}</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-yellow-600 text-xl">⚠️</div>
                                <div>
                                    <h3 className="font-semibold text-yellow-800 mb-1">{t("howto.sect3_admin_title")}</h3>
                                    <p className="text-yellow-700">{t("howto.sect3_admin_desc")}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="text-center pt-4">
                    <Link to="/" className="btn btn-primary btn-wide">{t("howto.btn_back")}</Link>
                </div>
            </div>
        </div>
    );
}
