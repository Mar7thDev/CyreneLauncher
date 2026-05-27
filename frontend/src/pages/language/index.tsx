import { useEffect, useState } from 'react'
import { Folder, Settings, Check, X, Globe, Mic } from 'lucide-react'
import { FSService } from '@bindings/cyrene-launcher/internal/fs-service'
import { LanguageService } from '@bindings/cyrene-launcher/internal/language-service'
import { toast } from 'react-toastify'
import useSettingStore from '@/stores/settingStore'
import { useTranslation } from "react-i18next"

export default function LanguagePage() {
    const { gameDir, setGameDir } = useSettingStore()
    const [folderCheckResult, setFolderCheckResult] = useState<'success' | 'error' | null>(null)

    const [textLang, setTextLang] = useState('')
    const [voiceLang, setVoiceLang] = useState('')

    const [selectedTextLang, setSelectedTextLang] = useState('')
    const [selectedVoiceLang, setSelectedVoiceLang] = useState('')

    const [isLoading, setIsLoading] = useState(false)
    const [isSettingLanguage, setIsSettingLanguage] = useState(false)

    const languageOptions = [
        { value: 'en', label: 'English', flag: '🇺🇸' },
        { value: 'cn', label: 'Chinese', flag: '🇨🇳' },
        { value: 'jp', label: 'Japanese', flag: '🇯🇵' },
        { value: 'kr', label: 'Korean', flag: '🇰🇷' }
    ]
    const { t } = useTranslation()

    useEffect(() => {
        const getLanguage = async () => {
            if (!gameDir) return

            const subPath = "StarRail_Data/StreamingAssets"
            const fullPath = `${gameDir}/${subPath}`

            const exists = await FSService.DirExists(fullPath)
            if (!exists) {
                setTextLang("")
                setVoiceLang("")
                setSelectedTextLang("")
                setSelectedVoiceLang("")
                setFolderCheckResult("error")
                setGameDir("")
                return
            }

            const [ok, textLang, voiceLang, err] = await LanguageService.GetLanguage(fullPath)
            if (!ok) {
                setTextLang("")
                setVoiceLang("")
                setSelectedTextLang("")
                setSelectedVoiceLang("")
                setFolderCheckResult("error")
                setGameDir("")
                toast.error(err)
                return
            }

            // success
            setTextLang(textLang)
            setVoiceLang(voiceLang)
            setFolderCheckResult("success")
            setSelectedTextLang(textLang)
            setSelectedVoiceLang(voiceLang)
        }

        getLanguage()
    }, [gameDir])

    const handlePickFolder = async () => {
        try {
            setIsLoading(true)
            const basePath = await FSService.PickFolder()
            if (basePath) {
                setGameDir(basePath)
                const subPath = 'StarRail_Data/StreamingAssets/DesignData/Windows'
                const fullPath = `${basePath}/${subPath}`
                const exists = await FSService.DirExists(fullPath)
                setFolderCheckResult(exists ? 'success' : 'error')
                setGameDir(exists ? basePath : "")
                if (!exists) {
                    toast.error(t("diff.toast_game_dir_not_found"))
                }
            } else {
                toast.error(t("language.toast_no_folder_selected"))
                setFolderCheckResult('error')
                setGameDir('')
            }
        } catch (err: any) {
            toast.error(t("language.toast_pick_folder_error"), err)
            setFolderCheckResult('error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetLanguage = async () => {
        if (!gameDir) {
            toast.error(t("language.toast_no_folder_selected"))
            return
        }
        try {
            setIsSettingLanguage(true)
            const [ok, err] = await LanguageService.SetLanguage(
                `${gameDir}/StarRail_Data/StreamingAssets/DesignData/Windows`,
                selectedTextLang,
                selectedVoiceLang
            )
            if (ok) {
                toast.success(t("language.toast_set_language_success"))
                setTextLang(selectedTextLang)
                setVoiceLang(selectedVoiceLang)
            }
            else {
                toast.error(err)
            }

        } catch (err: any) {
            toast.error(t("language.toast_set_language_error"), err)
        } finally {
            setIsSettingLanguage(false)
        }
    }

    const getLanguageLabel = (code: string) => {
        const lang = languageOptions.find(l => l.value === code)
        return lang ? `${lang.flag} ${lang.label}` : code
    }

    return (
        <div className="p-2 mx-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-2">
                    <h1 className="text-4xl font-bold mb-2">
                        {t("language.header_title")}
                    </h1>
                    <p className="">{t("language.header_desc")}</p>
                </div>

                {/* Main Content */}
                <div className="rounded-2xl p-2 space-y-4">

                    {/* Folder Selection Section */}
                    <div className="pb-2">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Folder className="text-primary" size={24} />
                            {t("language.game_dir_title")}
                        </h2>

                        <div className="space-y-1">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 items-center'>
                                <button
                                    onClick={handlePickFolder}
                                    disabled={isLoading}
                                    className="btn btn-primary"
                                >
                                    <Folder size={20} />
                                    {isLoading ? t("language.btn_selecting") : t("language.btn_select_game") }
                                </button>

                                {gameDir && (
                                    <div className="rounded-lg p-2">
                                        <p className="font-mono text-sm px-3 py-2 rounded border truncate max-w-full overflow-hidden whitespace-nowrap">
                                            {gameDir}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {folderCheckResult && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${folderCheckResult === 'success'
                                    ? 'bg-success/5 text-success border border-success'
                                    : 'bg-error/5 text-error border border-error'
                                    }`}>
                                    {folderCheckResult === 'success' ? (
                                        <>
                                            <Check size={20} />
                                            <span>{t("language.game_dir_valid")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <X size={20} />
                                            <span>{t("language.game_dir_invalid")}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Language Display */}
                    {(textLang && voiceLang) && (
                        <div className="pb-2">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                <Globe className="text-primary" size={24} />
                                {t("language.current_languages_title")}
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-success/5 rounded-lg p-2 border border-success/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe size={20} className="text-success" />
                                        <span className="font-bold text-success">{t("language.text_language")}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-success">
                                        {getLanguageLabel(textLang)}
                                    </p>
                                </div>

                                <div className="bg-warning/5 rounded-lg p-2 border border-warning/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mic size={20} className="text-accent" />
                                        <span className="font-bold text-accent">{t("language.voice_language")}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-accent">
                                        {getLanguageLabel(voiceLang)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Language Selection */}
                    <div className={`transition-opacity duration-300 ${gameDir === "" ? 'opacity-50 pointer-events-none' : ''
                        }`}>
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Settings className="text-primary" size={24} />
                            {t("language.language_settings_title")}
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="flex text-sm font-medium text-success items-center gap-2">
                                    <Globe size={16} />
                                    {t("language.text_language")}
                                </label>
                                <select
                                    value={selectedTextLang}
                                    onChange={(e) => setSelectedTextLang(e.target.value)}
                                    className="w-full select select-success"
                                >
                                    <option value="">{t("language.select_text_placeholder")}</option>
                                    {languageOptions.map(lang => (
                                        <option key={lang.value} value={lang.value}>
                                            {lang.flag} {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="flex text-sm font-medium text-accent items-center gap-2">
                                    <Mic size={16} />
                                    {t("language.voice_language")}
                                </label>
                                <select
                                    value={selectedVoiceLang}
                                    onChange={(e) => setSelectedVoiceLang(e.target.value)}
                                    className="w-full select select-warning"
                                >
                                    <option value="">{t("language.select_voice_placeholder")}.</option>
                                    {languageOptions.map(lang => (
                                        <option key={lang.value} value={lang.value}>
                                            {lang.flag} {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={handleSetLanguage}
                                disabled={!selectedTextLang || !selectedVoiceLang || isSettingLanguage}
                                className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Settings size={20} />
                                {isSettingLanguage ? t("language.btn_applying") : t("language.btn_apply")}
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-info/5 rounded-lg p-4 border border-info/30 mt-6">
                        <h3 className="font-medium text-error mb-2">{t("language.inst_title")}</h3>
                        <ol className="text-sm text-error space-y-1">
                            <li>{t("language.inst_step_1")}</li>
                            <li>{t("language.inst_step_2")}</li>
                            <li>{t("language.inst_step_3")}</li>
                            <li>{t("language.inst_step_4")}</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    )
}