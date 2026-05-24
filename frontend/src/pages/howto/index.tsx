import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export default function HowToPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className=" w-full bg-base-100 shadow-xl rounded-2xl p-8 space-y-8">
                <h1 className="text-4xl font-bold text-primary text-center">{t("howto.title")}</h1>

                {/* Section 1: Launcher Features */}
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2 mb-4">
                        <span>🚀</span>
                        <span>{t("howto.sect1_title")}</span>
                    </h2>
                    <div className="space-y-3 text-green-700">
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">🔄</div>
                            <p>{t("howto.sect1_auto_update_pre")} <span className="font-semibold text-amber-600">Firefly Go</span> {t("howto.sect1_auto_update_post")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">🎮</div>
                            <p>{t("howto.sect1_launch_game")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-lg">🌐</div>
                            <p>{t("howto.sect1_lang_pre")} <Link to="/language" className="link link-info font-mono">{t("howto.sect1_lang_link")}</Link>
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-green-600 text-2xl">📦</div>
                            <div>
                                <p className="text-green-800 font-semibold">
                                    {t("howto.sect1_patch_title")}
                                </p>
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

                {/* Section 2: FireflyGo Commands */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2 mb-4">
                        <span>📜</span>
                        <span>{t("howto.sect2_title")}</span>
                    </h2>

                    <p className="text-blue-700 mb-4">
                        {t("howto.sect2_desc_pre")} <span className="font-semibold text-accent">{t("howto.sect2_desc_bold")}</span>{t("howto.sect2_desc_post")}
                    </p>

                    {/* Theorycraft Mode Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="text-red-600 text-xl">🔒</div>
                            <div>
                                <h3 className="font-semibold text-red-800 mb-2">{t("howto.sect2_tc_req_title")}</h3>
                                <p className="text-red-700 mb-2">{t("howto.sect2_tc_req_desc_pre")} <strong>{t("howto.sect2_tc_req_desc_bold")}</strong> {t("howto.sect2_tc_req_desc_post")}</p>
                                <div className="flex flex-wrap gap-2">
                                    <code className="bg-red-100 px-2 py-1 rounded text-sm text-red-800">/cycle</code>
                                    <code className="bg-red-100 px-2 py-1 rounded text-sm text-red-800">/hp</code>
                                    <code className="bg-red-100 px-2 py-1 rounded text-sm text-red-800">/log</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 text-lg">✨</div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-800 mb-1">{t("howto.sect2_extra_title")}</h4>

                                <div className="space-y-4 text-blue-700 text-sm">

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                                            🎭 {t("howto.sect2_hidden_ui_title")}
                                        </h5>
                                        <p className="mt-1">
                                            {t("howto.sect2_hidden_ui_desc")}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                                            🚫 {t("howto.sect2_censor_title")}
                                        </h5>
                                        <p className="mt-1">
                                            {t("howto.sect2_censor_desc")}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                                            🧪 {t("howto.sect2_tc_title")}
                                        </h5>
                                        <p className="mt-1">
                                            {t("howto.sect2_tc_desc")}
                                        </p>
                                    </div>
                                </div>


                                <div className="mt-4 aspect-w-16 aspect-h-9">
                                    <iframe
                                        src="https://www.youtube.com/embed/uiKdFrvn9NQ"
                                        title="Extra Settings Tutorial"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="rounded-lg w-full h-75"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Commands List */}
                    <div className="space-y-4 mt-4">
                        <h3 className="text-lg font-semibold text-blue-800">{t("howto.sect2_cmd_title")}</h3>

                        {/* Theorycraft Toggle */}
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-lg">⚙️</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">{t("howto.sect2_cmd_tc")}</h4>
                                    <div className="space-y-1 text-blue-700">
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/theorycraft 1</code> {t("howto.sect2_cmd_tc_enable")}</p>
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/theorycraft 0</code> {t("howto.sect2_cmd_tc_disable")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cycle Command */}
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-lg">🔄</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">{t("howto.sect2_cmd_cycle")} <span className="text-red-600 text-sm">{t("howto.sect2_cmd_tc_only")}</span></h4>
                                    <div className="space-y-1 text-blue-700">
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/cycle N</code> {t("howto.sect2_cmd_cycle_desc")}</p>
                                        <p className="text-sm">{t("howto.sect2_cmd_cycle_ex1_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/cycle 30</code> {t("howto.sect2_cmd_cycle_ex1_post")}</p>
                                        <p className="text-sm"><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/cycle 0</code> {t("howto.sect2_cmd_cycle_ex2_post")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* HP Command */}
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-lg">❤️</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">
                                        {t("howto.sect2_cmd_hp")} <span className="text-red-600 text-sm">{t("howto.sect2_cmd_tc_only")}</span>
                                    </h4>
                                    <div className="space-y-2 text-blue-700 text-sm">
                                        <p>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/hp N</code> {t("howto.sect2_cmd_hp_desc1")}
                                        </p>
                                        <p>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/hp 0</code> {t("howto.sect2_cmd_hp_desc2")}
                                        </p>
                                        <p>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/hp Wave V1 V2 ...</code> {t("howto.sect2_cmd_hp_desc3")}
                                        </p>
                                        <p className="ml-4">
                                            {t("howto.sect2_cmd_hp_ex_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/hp 1 2000000 3000000</code> {t("howto.sect2_cmd_hp_ex_post")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Log Command */}
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-lg">📝</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">{t("howto.sect2_cmd_log")} <span className="text-red-600 text-sm">{t("howto.sect2_cmd_tc_only")}</span></h4>
                                    <div className="space-y-1 text-blue-700">
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/log 1</code> {t("howto.sect2_cmd_log_desc1")}</p>
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/log 0</code> {t("howto.sect2_cmd_log_desc2")}</p>
                                        <p className="text-sm">{t("howto.sect2_cmd_log_out_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">.json</code></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skip Command */}
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-lg">⏭️</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">{t("howto.sect2_cmd_skip")}</h4>
                                    <div className="space-y-1 text-blue-700">
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/skip N</code> {t("howto.sect2_cmd_skip_desc")}</p>
                                        <p className="text-sm">{t("howto.sect2_cmd_skip_ex1_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/skip 2</code> {t("howto.sect2_cmd_skip_ex1_post")}</p>
                                        <p className="text-sm"><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/skip 0</code> {t("howto.sect2_cmd_skip_ex2_post")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ID Command */}
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-lg">🔄</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">{t("howto.sect2_cmd_id")}</h4>
                                    <div className="space-y-1 text-blue-700">
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/id CHAR_ID</code> {t("howto.sect2_cmd_id_desc")}</p>
                                        <p className="text-sm">{t("howto.sect2_cmd_id_ex1_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/id 8008</code> {t("howto.sect2_cmd_id_ex1_post")}</p>
                                        <p className="text-sm">{t("howto.sect2_cmd_id_ex2_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">8001 → 8008</code>, <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">1001 → 1224</code></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Update Command */}
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-lg">🔄</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">{t("howto.sect2_cmd_update")}</h4>
                                    <div className="space-y-1 text-blue-700">
                                        <p><code className="bg-blue-100 px-1 py-0.5 rounded text-sm">/update</code> {t("howto.sect2_cmd_update_desc_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">freesr-data.json</code></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Other Notes */}
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <span>📌</span>
                        <span>{t("howto.sect3_title")}</span>
                    </h2>

                    <div className="space-y-4">
                        {/* Administrator Note */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-yellow-600 text-xl">⚠️</div>
                                <div>
                                    <h3 className="font-semibold text-yellow-800 mb-1">{t("howto.sect3_admin_title")}</h3>
                                    <p className="text-yellow-700">
                                        {t("howto.sect3_admin_desc")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Backup Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 text-xl">💾</div>
                                <div>
                                    <h3 className="font-semibold text-blue-800 mb-1">{t("howto.sect3_backup_title")}</h3>
                                    <p className="text-blue-700">
                                        {t("howto.sect3_backup_desc_pre")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">config.json</code> {t("howto.sect3_backup_desc_mid")} <code className="bg-blue-100 px-1 py-0.5 rounded text-sm">freesr-data.json</code> {t("howto.sect3_backup_desc_post")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Voice Pack Note */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-green-600 text-xl">🎵</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-green-800 mb-2">{t("howto.sect3_voice_title")}</h3>
                                    <div className="space-y-3 text-green-700">
                                        <div className="flex items-start gap-2">
                                            <span className="font-medium min-w-5 text-green-600">1.</span>
                                            <div>
                                                <p className="mb-1">{t("howto.sect3_voice_step1_pre")} <code className="bg-green-100 px-1 py-0.5 rounded text-sm">Japanese</code>, <code className="bg-green-100 px-1 py-0.5 rounded text-sm">English</code>{t("howto.sect3_voice_step1_mid")}</p>
                                                <code className="block bg-green-100 px-2 py-1 rounded text-sm mt-1">
                                                    Star Rail\Games\StarRail_Data\Persistent\Audio\AudioPackage\Windows
                                                </code>
                                                <p className="mt-1">{t("howto.sect3_voice_step1_post_pre")} <strong>{t("howto.sect3_voice_step1_post_bold")}</strong> {t("howto.sect3_voice_step1_post_post")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="font-medium min-w-5 text-green-600">2.</span>
                                            <p>{t("howto.sect3_voice_step2")}</p>
                                        </div>
                                    </div>
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