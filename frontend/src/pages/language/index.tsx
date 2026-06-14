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
        <div className="launcher-tool-page p-2 mx-4">
            <div className="max-w-4xl mx-auto launcher-tool-shell rounded-2xl px-6 py-5">
                {/* Header */}
                <div className="text-center mb-2">
                    <h1 className="text-4xl font-bold mb-2 launcher-tool-title">
                        {t("language.header_title")}
                    </h1>
                    <p className="launcher-tool-subtitle">{t("language.header_desc")}</p>
                </div>

                {/* Main Content */}
                <div className="rounded-2xl p-2 space-y-4">

                    {/* Folder Selection Section */}
                    <div className="pb-2">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 launcher-tool-heading">
                            <Folder className="launcher-tool-icon" size={24} />
                            {t("language.game_dir_title")}
                        </h2>

                        <div className="space-y-1">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 items-center'>
                                <button
                                    onClick={handlePickFolder}
                                    disabled={isLoading}
                                    className="btn launcher-tool-button"
                                >
                                    <Folder size={20} />
                                    {isLoading ? t("language.btn_selecting") : t("language.btn_select_game") }
                                </button>

                                {gameDir && (
                                    <div className="rounded-lg p-2">
                                        <p className="font-mono text-sm px-3 py-2 rounded launcher-path-surface truncate max-w-full overflow-hidden whitespace-nowrap">
                                            {gameDir}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {folderCheckResult && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${folderCheckResult === 'success'
                                    ? 'launcher-status-success'
                                    : 'launcher-status-error'
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
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 launcher-tool-heading">
                                <Globe className="launcher-tool-icon" size={24} />
                                {t("language.current_languages_title")}
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="launcher-status-success rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe size={20} />
                                        <span className="font-bold">{t("language.text_language")}</span>
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {getLanguageLabel(textLang)}
                                    </p>
                                </div>

                                <div className="launcher-status-warning rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mic size={20} />
                                        <span className="font-bold">{t("language.voice_language")}</span>
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {getLanguageLabel(voiceLang)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Language Selection */}
                    <div className={`transition-opacity duration-300 ${gameDir === "" ? 'opacity-50 pointer-events-none' : ''
                        }`}>
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 launcher-tool-heading">
                            <Settings className="launcher-tool-icon" size={24} />
                            {t("language.language_settings_title")}
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="flex text-sm font-medium launcher-setting-title items-center gap-2">
                                    <Globe size={16} />
                                    {t("language.text_language")}
                                </label>
                                <select
                                    value={selectedTextLang}
                                    onChange={(e) => setSelectedTextLang(e.target.value)}
                                    className="w-full select launcher-input"
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
                                <label className="flex text-sm font-medium launcher-setting-title items-center gap-2">
                                    <Mic size={16} />
                                    {t("language.voice_language")}
                                </label>
                                <select
                                    value={selectedVoiceLang}
                                    onChange={(e) => setSelectedVoiceLang(e.target.value)}
                                    className="w-full select launcher-input"
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
                                className="launcher-gradient text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 launcher-gradient-shadow disabled:cursor-not-allowed cursor-pointer disabled:opacity-60"
                            >
                                <Settings size={20} />
                                {isSettingLanguage ? t("language.btn_applying") : t("language.btn_apply")}
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="launcher-info-panel rounded-lg p-4 mt-6">
                        <h3 className="font-medium mb-2">{t("language.inst_title")}</h3>
                        <ol className="text-sm space-y-1">
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
