import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function FireflyToolsPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className="w-full bg-base-100 shadow-xl rounded-2xl p-8 space-y-8">
                <h1 className="text-4xl font-bold text-primary text-center">{t("fireflytools.title")}</h1>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2 mb-4">
                        <span>ℹ️</span>
                        <span>{t("fireflytools.sect1_title")}</span>
                    </h2>
                    <div className="space-y-3 text-blue-700">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 text-lg">🏠</div>
                            <p>
                                {t("fireflytools.sect1_p1_pre")}
                                <span className="font-semibold text-success">{t("fireflytools.sect1_p1_tool")}</span>
                                {t("fireflytools.sect1_p1_mid")}
                                <span className="font-semibold text-accent">{t("fireflytools.sect1_p1_author")}</span>
                            </p>
                        </div>
                            <div className="bg-white border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-blue-600 text-lg">🏆</span>
                                    <span className="font-semibold text-blue-800">{t("fireflytools.sect1_master_site")}</span>
                                </div>
                                <a
                                    href="https://srtools.punklorde.org"
                                    className="link link-accent font-mono text-sm break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    https://srtools.punklorde.org
                                </a>
                            </div>
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 text-lg">👨‍💻</div>
                            <p>{t("fireflytools.sect1_p2_pre")}<span className="font-semibold text-accent">{t("fireflytools.sect1_p2_author")}</span>{t("fireflytools.sect1_p2_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 text-lg">🔗</div>
                            <p>{t("fireflytools.sect1_p3_pre")}
                                <a
                                    href="https://srtools.neonteam.dev"
                                    className="link link-accent"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    srtools.neonteam.dev
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2 mb-4">
                        <span>🔧</span>
                        <span>{t("fireflytools.sect2_title")}</span>
                    </h2>
                    <div className="space-y-3 text-green-700">
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">⚙️</div>
                            <p>{t("fireflytools.sect2_feat1")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">🔌</div>
                            <p>{t("fireflytools.sect2_feat2_pre")}<span className="font-semibold text-accent">{t("fireflytools.sect2_feat2_server")}</span>{t("fireflytools.sect2_feat2_mid")}<span className="font-semibold">{t("fireflytools.sect2_feat2_conn")}</span>{t("fireflytools.sect2_feat2_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-2xl">✨</div>
                            <div>
                                <h4 className="font-semibold text-green-800 text-lg">{t("fireflytools.sect2_feat3_title")}</h4>
                                <p className="text-green-700 mt-1">
                                    {t("fireflytools.sect2_feat3_desc_pre")}<span className="font-semibold text-accent">{t("fireflytools.sect2_feat3_desc_server")}</span>{t("fireflytools.sect2_feat3_desc_post")}
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-green-700">
                                    <li>🎭 <span className="font-medium">{t("fireflytools.sect2_feat3_ui")}</span> {t("fireflytools.sect2_feat3_ui_desc")}</li>
                                    <li>🚫 <span className="font-medium">{t("fireflytools.sect2_feat3_censor")}</span> {t("fireflytools.sect2_feat3_censor_desc")}</li>
                                    <li>🧪 <span className="font-medium">{t("fireflytools.sect2_feat3_tc")}</span> {t("fireflytools.sect2_feat3_tc_desc")}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">📂</div>
                            <p>{t("fireflytools.sect2_feat4_pre")}<code className="bg-gray-200 px-2 py-1 rounded text-sm">freesr-data.json</code>{t("fireflytools.sect2_feat4_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">⚡</div>
                            <p>{t("fireflytools.sect2_feat5")}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2 mb-4">
                        <span>🚀</span>
                        <span>{t("fireflytools.sect3_title")}</span>
                    </h2>
                    <div className="space-y-3 text-purple-700">
                        <div className="flex items-start gap-3">
                            <div className="text-purple-600 text-lg">1️⃣</div>
                            <p>{t("fireflytools.sect3_step1")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-purple-600 text-lg">2️⃣</div>
                            <p>{t("fireflytools.sect3_step2")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-purple-600 text-lg">3️⃣</div>
                            <p>{t("fireflytools.sect3_step3_pre")}<span className="font-semibold">{t("fireflytools.sect3_step3_bold")}</span>{t("fireflytools.sect3_step3_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-purple-600 text-lg">4️⃣</div>
                            <p>{t("fireflytools.sect3_step4")}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <Link to="/" className="btn btn-primary btn-wide">{t("fireflytools.btn_back")}</Link>
                </div>
            </div>
        </div>
    );
}