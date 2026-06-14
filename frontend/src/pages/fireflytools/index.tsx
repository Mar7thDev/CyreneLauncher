import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function FireflyToolsPage() {
    const { t } = useTranslation();

    return (
        <div className="launcher-tool-page min-h-screen flex items-center justify-center p-6">
            <div className="w-full launcher-tool-shell rounded-2xl p-8 space-y-8">
                <h1 className="text-4xl font-bold launcher-tool-title text-center">{t("fireflytools.title")}</h1>

                <div className="launcher-info-panel border-l-4 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <span>ℹ️</span>
                        <span>{t("fireflytools.sect1_title")}</span>
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">🏠</div>
                            <p>
                                {t("fireflytools.sect1_p1_pre")}
                                <span className="font-semibold launcher-setting-title">{t("fireflytools.sect1_p1_tool")}</span>
                                {t("fireflytools.sect1_p1_mid")}
                                <span className="font-semibold launcher-accent-text">{t("fireflytools.sect1_p1_author")}</span>
                            </p>
                        </div>
                            <div className="launcher-info-card rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="launcher-tool-icon text-lg">🏆</span>
                                    <span className="font-semibold">{t("fireflytools.sect1_master_site")}</span>
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
                            <div className="launcher-tool-icon text-lg">👨‍💻</div>
                            <p>{t("fireflytools.sect1_p2_pre")}<span className="font-semibold launcher-accent-text">{t("fireflytools.sect1_p2_author")}</span>{t("fireflytools.sect1_p2_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">🔗</div>
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

                <div className="launcher-info-panel border-l-4 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <span>🔧</span>
                        <span>{t("fireflytools.sect2_title")}</span>
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">⚙️</div>
                            <p>{t("fireflytools.sect2_feat1")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">🔌</div>
                            <p>{t("fireflytools.sect2_feat2_pre")}<span className="font-semibold launcher-accent-text">{t("fireflytools.sect2_feat2_server")}</span>{t("fireflytools.sect2_feat2_mid")}<span className="font-semibold">{t("fireflytools.sect2_feat2_conn")}</span>{t("fireflytools.sect2_feat2_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-2xl">✨</div>
                            <div>
                                <h4 className="font-semibold launcher-setting-title text-lg">{t("fireflytools.sect2_feat3_title")}</h4>
                                <p className="mt-1">
                                    {t("fireflytools.sect2_feat3_desc_pre")}<span className="font-semibold launcher-accent-text">{t("fireflytools.sect2_feat3_desc_server")}</span>{t("fireflytools.sect2_feat3_desc_post")}
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>🎭 <span className="font-medium">{t("fireflytools.sect2_feat3_ui")}</span> {t("fireflytools.sect2_feat3_ui_desc")}</li>
                                    <li>🚫 <span className="font-medium">{t("fireflytools.sect2_feat3_censor")}</span> {t("fireflytools.sect2_feat3_censor_desc")}</li>
                                    <li>🧪 <span className="font-medium">{t("fireflytools.sect2_feat3_tc")}</span> {t("fireflytools.sect2_feat3_tc_desc")}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">📂</div>
                            <p>{t("fireflytools.sect2_feat4_pre")}<code className="launcher-inline-code px-2 py-1 rounded text-sm">freesr-data.json</code>{t("fireflytools.sect2_feat4_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">⚡</div>
                            <p>{t("fireflytools.sect2_feat5")}</p>
                        </div>
                    </div>
                </div>

                <div className="launcher-info-panel border-l-4 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                        <span>🚀</span>
                        <span>{t("fireflytools.sect3_title")}</span>
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">1️⃣</div>
                            <p>{t("fireflytools.sect3_step1")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">2️⃣</div>
                            <p>{t("fireflytools.sect3_step2")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">3️⃣</div>
                            <p>{t("fireflytools.sect3_step3_pre")}<span className="font-semibold">{t("fireflytools.sect3_step3_bold")}</span>{t("fireflytools.sect3_step3_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="launcher-tool-icon text-lg">4️⃣</div>
                            <p>{t("fireflytools.sect3_step4")}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <Link to="/" className="btn launcher-tool-button btn-wide">{t("fireflytools.btn_back")}</Link>
                </div>
            </div>
        </div>
    );
}
