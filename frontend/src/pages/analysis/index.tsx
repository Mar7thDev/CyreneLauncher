import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export default function AnalysisPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className="w-full bg-base-100 shadow-xl rounded-2xl p-8 space-y-8">
                <h1 className="text-4xl font-bold text-primary text-center">
                    {t("analysis.title")}
                </h1>

                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2 mb-4">
                        <span>🔬</span>
                        <span>{t("analysis.sect1_title")}</span>
                    </h2>
                    
                    <div className="space-y-4 text-green-700">
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">⚡</div>
                            <div>
                                <p className="mb-2">
                                    <span className="font-semibold text-success">{t("analysis.sect1_p1_pre")}</span>
                                    {t("analysis.sect1_p1_mid")}
                                    <span className="text-info font-mono bg-blue-100 px-2 py-1 rounded">{t("analysis.sect1_p1_highlight")}</span>
                                    {t("analysis.sect1_p1_post")}
                                </p>
                                <p className="text-sm">{t("analysis.sect1_p2")}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-600 text-lg">📁</span>
                                <span className="font-semibold text-green-800">{t("analysis.sect1_github")}</span>
                            </div>
                            <a
                                href="https://github.com/hessiser/veritas"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-info font-mono break-all"
                            >
                                https://github.com/hessiser/veritas
                            </a>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2 mb-4">
                        <span>🌐</span>
                        <span>{t("analysis.sect2_title")}</span>
                    </h2>
                    
                    <div className="space-y-4">
                        <p className="text-blue-700">
                            {t("analysis.sect2_desc")}
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-blue-600 text-lg">🏆</span>
                                    <span className="font-semibold text-blue-800">{t("analysis.sect2_master")}</span>
                                </div>
                                <a
                                    href="https://sranalysis.punklorde.org"
                                    className="link link-accent font-mono text-sm break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    https://sranalysis.punklorde.org
                                </a>
                            </div>
                            
                            <div className="bg-white border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-blue-600 text-lg">🔄</span>
                                    <span className="font-semibold text-blue-800">{t("analysis.sect2_backup")}</span>
                                </div>
                                <a
                                    href="https://firefly-sranalysis.vercel.app/"
                                    className="link link-accent font-mono text-sm break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    https://firefly-sranalysis.vercel.app
                                </a>
                            </div>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <div className="text-yellow-600 text-lg">💡</div>
                                <p className="text-yellow-800 text-sm">
                                    <strong>{t("analysis.sect2_tip_pre")}</strong>{t("analysis.sect2_tip_post")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-red-800 flex items-center gap-2 mb-4">
                        <span>⚠️</span>
                        <span>{t("analysis.sect3_title")}</span>
                    </h2>
                    
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-red-600 text-xl">📋</div>
                            <div>
                                <h3 className="font-semibold text-red-800 mb-2">{t("analysis.sect3_subtitle")}</h3>
                                <p className="text-red-700 mb-2">
                                    {t("analysis.sect3_desc")}
                                </p>
                                <div className="bg-red-100 p-3 rounded-lg">
                                    <p className="text-red-800 font-mono text-sm">
                                        {t("analysis.sect3_rename")}<code className="bg-red-200 px-1 py-0.5 rounded">veritas.dll</code> → <code className="bg-red-200 px-1 py-0.5 rounded">astrolabe.dll</code>
                                    </p>
                                    <p className="text-red-800 text-sm mt-1">
                                        {t("analysis.sect3_place")}<code className="bg-red-200 px-1 py-0.5 rounded">astrolabe.dll</code>{t("analysis.sect3_place_post")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2 mb-4">
                        <span>🛠️</span>
                        <span>{t("analysis.sect4_title")}</span>
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="bg-white border border-purple-200 rounded-lg p-4">
                            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                <span className="text-purple-600">🚀</span>
                                <span>{t("analysis.sect4_sub1")}</span>
                            </h3>
                            <div className="space-y-2 text-purple-700">
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">1.</span>
                                    <p>{t("analysis.sect4_sub1_step1_pre")}<span className="font-semibold">{t("analysis.sect4_sub1_step1_game")}</span>{t("analysis.sect4_sub1_step1_mid")}<span className="font-semibold">{t("analysis.sect4_sub1_step1_server")}</span>{t("analysis.sect4_sub1_step1_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">2.</span>
                                    <p>{t("analysis.sect4_sub1_step2")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">3.</span>
                                    <p>{t("analysis.sect4_sub1_step3_pre")}<strong>{t("analysis.sect4_sub1_step3_conn")}</strong>{t("analysis.sect4_sub1_step3_mid1")}<strong>{t("analysis.sect4_sub1_step3_type")}</strong>{t("analysis.sect4_sub1_step3_mid2")}<strong>{t("analysis.sect4_sub1_step3_btn")}</strong>{t("analysis.sect4_sub1_step3_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">4.</span>
                                    <p>{t("analysis.sect4_sub1_step4")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-purple-200 rounded-lg p-4">
                            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                <span className="text-purple-600">🌐</span>
                                <span>{t("analysis.sect4_sub2")}</span>
                            </h3>
                            <div className="space-y-2 text-purple-700">
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">1.</span>
                                    <p>{t("analysis.sect4_sub2_step1_pre")}<span className="font-semibold">{t("analysis.sect4_sub2_step1_game")}</span>{t("analysis.sect4_sub2_step1_mid")}<span className="font-semibold">{t("analysis.sect4_sub2_step1_server")}</span>{t("analysis.sect4_sub2_step1_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">2.</span>
                                    <p>{t("analysis.sect4_sub2_step2")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">3.</span>
                                    <p>{t("analysis.sect4_sub2_step3_pre")}<strong>{t("analysis.sect4_sub2_step3_conn")}</strong>{t("analysis.sect4_sub2_step3_mid1")}<strong>{t("analysis.sect4_sub2_step3_type")}</strong>{t("analysis.sect4_sub2_step3_mid2")}<strong>{t("analysis.sect4_sub2_step3_btn")}</strong>{t("analysis.sect4_sub2_step3_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-purple-600">4.</span>
                                    <p>{t("analysis.sect4_sub2_step4")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-6">
                    <Link to="/" className="btn btn-primary btn-wide">{t("analysis.btn_back")}</Link>
                </div>
            </div>
        </div>
    );
}