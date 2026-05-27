import useSettingStore from "@/stores/settingStore"
import { Check, Folder, File, X, Settings } from "lucide-react"
import { useEffect } from "react"
import { toast } from "react-toastify"
import { DiffService } from "@bindings/cyrene-launcher/internal/diff-service"
import { FSService } from "@bindings/cyrene-launcher/internal/fs-service"
import { motion } from "motion/react"
import useDiffStore from "@/stores/diffStore"
import { useTranslation } from "react-i18next"

export default function DiffPage() {
    const { gameDir, setGameDir } = useSettingStore()
    const {
        isLoading,
        setIsLoading,
        folderCheckResult,
        setFolderCheckResult,
        diffDir,
        setDiffDir,
        diffCheckResult,
        setDiffCheckResult,
        isDiffLoading,
        setIsDiffLoading,
        progressUpdate,
        setProgressUpdate,
        maxProgressUpdate,
        setMaxProgressUpdate,
        stageType,
        setStageType,
        messageUpdate,
        setMessageUpdate
    } = useDiffStore()
    const { t } = useTranslation()

    useEffect(() => {
        const getLanguage = async () => {
            if (gameDir) {
                const subPath = 'StarRail_Data/StreamingAssets/DesignData/Windows'
                const fullPath = `${gameDir}/${subPath}`

                const exists = await FSService.DirExists(fullPath)
                if (exists) {
                    setFolderCheckResult('success')
                } else {
                    setFolderCheckResult('error')
                    setGameDir('')
                }
            }
        }
        getLanguage()
    }, [gameDir])

    const handlePickGameFolder = async () => {
        try {
            setIsLoading({ game: true, diff: false })
            const basePath = await FSService.PickFolder()
            if (basePath) {
                setGameDir(basePath)
                const subPath = 'StarRail_Data/StreamingAssets/DesignData/Windows'
                const fullPath = `${basePath}/${subPath}`

                const exists = await FSService.DirExists(fullPath)
                setFolderCheckResult(exists ? 'success' : 'error')
                setGameDir(exists ? basePath : '')
                if (!exists) {
                    toast.error(t("diff.toast_game_dir_not_found"))
                }
            } else {
                toast.error(t("diff.toast_no_folder_selected"))
                setFolderCheckResult('error')
                setGameDir('')
            }
        } catch (err: any) {
            toast.error(t("diff.toast_pick_folder_error"), err)
            setFolderCheckResult('error')
        } finally {
            setIsLoading({ game: false, diff: false })
        }
    }

    const handlePickDiffFile = async () => {
        try {
            setIsLoading({ game: false, diff: true })
            const basePath = await FSService.PickFile("")
            if (basePath) {
                if (!basePath.endsWith(".7z") && !basePath.endsWith(".zip") && !basePath.endsWith(".rar")) {
                    toast.error(t("diff.toast_invalid_file_type"))
                    setDiffCheckResult('error')
                    setDiffDir('')
                    return
                }
                setDiffDir(basePath)
                setDiffCheckResult('success')
            } else {
                toast.error(t("diff.toast_no_file_selected"))
                setDiffCheckResult('error')
                setDiffDir('')
            }
        } catch (err: any) {
            toast.error(t("diff.toast_pick_file_error"), err)
            setDiffCheckResult('error')
        } finally {
            setIsLoading({ game: false, diff: false })
        }
    }

    const handleUpdateGame = async () => {
        const handleResult = (ok: boolean, error: string) => {
            if (!ok) {
                toast.error(error)
                return false
            }
            return true
        }

        try {
            setIsDiffLoading(true)

            if (!gameDir || !diffDir) {
                toast.error(t("diff.toast_select_both"))
                return
            }

            setStageType(t("diff.stage_check_type"))
            setProgressUpdate(0)
            setMaxProgressUpdate(1)

            const [isOk, validType, errorType] = await DiffService.CheckTypeHDiff(diffDir)
            if (!handleResult(isOk, errorType)) return
            setProgressUpdate(1)

            if (['hdiffmap.json', 'hdifffiles.txt', 'hdifffiles.json'].includes(validType)) {
                setStageType(t("diff.stage_version_validate"))
                setProgressUpdate(0)
                setMaxProgressUpdate(1)
                const [validVersion, errorVersion] = await DiffService.VersionValidate(gameDir, diffDir)
                if (!handleResult(validVersion, errorVersion)) return
                setProgressUpdate(1)
            }

            setStageType(t("diff.stage_data_extract"))
            const [validData, errorData] = await DiffService.DataExtract(gameDir, diffDir)
            if (!handleResult(validData, errorData)) return

            setStageType(t("diff.stage_cut_data"))
            setMessageUpdate('')
            const [validCut, errorCut] = await DiffService.CutData(gameDir)
            if (!handleResult(validCut, errorCut)) return

            switch (validType) {
                case 'hdifffiles.txt':
                case 'hdiffmap.json':
                case 'hdifffiles.json': {
                    setStageType(t("diff.stage_patch_data"))
                    const [validPatch, errorPatch] = await DiffService.HDiffPatchData(gameDir)
                    if (!handleResult(validPatch, errorPatch)) return

                    setStageType(t("diff.stage_delete_old_files"))
                    const [validDelete, errorDelete] = await DiffService.DeleteFiles(gameDir)
                    if (!handleResult(validDelete, errorDelete)) return
                    break
                }
                case 'manifest': {
                    setStageType(t("diff.stage_patch_data"))
                    const [validPatch, errorPatch] = await DiffService.LDiffPatchData(gameDir)
                    if (!handleResult(validPatch, errorPatch)) return
                    break
                }
            }

            toast.success(t("diff.toast_update_completed"))
        } catch (err: any) {
            console.error(err)
            toast.error(`PickFile error: ${err}`)
        } finally {
            setIsDiffLoading(false)
        }
    }


    return (
        <div className="p-2 mx-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-2">
                    <h1 className="text-4xl font-bold mb-2">
                        {t("diff.header_title")}
                    </h1>
                    <p className="">{t("diff.header_desc")}</p>
                </div>

                {/* Main Content */}
                <div className="rounded-2xl p-2 space-y-4">

                    {/* Folder Selection Section */}
                    <div className="pb-2">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Folder className="text-primary" size={24} />
                            {t("diff.game_dir_title")}
                        </h2>

                        <div className="space-y-1">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 items-center'>
                                <button
                                    onClick={handlePickGameFolder}
                                    disabled={isLoading.game}
                                    className="btn btn-primary"
                                >
                                    <Folder size={20} />
                                    {isLoading.game ? t("diff.btn_selecting") : t("diff.btn_select_game")}
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
                                            <span>{t("diff.game_dir_valid")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <X size={20} />
                                            <span>{t("diff.game_dir_invalid")}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Folder Selection Section */}
                    <div className="pb-2">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <File className="text-primary" size={24} />
                            {t("diff.diff_file_title")}
                        </h2>

                        <div className="space-y-1">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 items-center'>
                                <button
                                    onClick={handlePickDiffFile}
                                    disabled={isLoading.diff}
                                    className="btn btn-primary"
                                >
                                    <File size={20} />
                                    {isLoading.diff ? t("diff.btn_selecting") : t("diff.btn_select_diff")}
                                </button>

                                {diffDir && (
                                    <div className="rounded-lg p-2">
                                        <p className="font-mono text-sm px-3 py-2 rounded border truncate max-w-full overflow-hidden whitespace-nowrap">
                                            {diffDir}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {diffCheckResult && (
                                <div className={`flex items-center gap-2 p-3 mt-2 rounded-lg ${diffCheckResult === 'success'
                                    ? 'bg-success/5 text-success border border-success'
                                    : 'bg-error/5 text-error border border-error'
                                    }`}>
                                    {diffCheckResult === 'success' ? (
                                        <>
                                            <Check size={20} />
                                            <span>{t("diff.diff_file_valid")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <X size={20} />
                                            <span>{t("diff.diff_file_invalid")}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Apply Button */}
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={handleUpdateGame}
                                disabled={!diffDir || !gameDir || isLoading.game || isLoading.diff}
                                className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Settings size={20} />
                                {isDiffLoading ? t("diff.btn_updating") : t("diff.btn_update_game") }
                            </button>
                        </div>
                    </div>

                    {isDiffLoading && (
                        <div className="fixed inset-0 z-50 h-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="relative w-[90%] max-w-5xl bg-base-100 text-base-content rounded-xl border border-purple-500/50 shadow-lg shadow-purple-500/20">
                                <div className="border-b border-purple-500/30 px-6 py-4 mb-4 text-center">
                                    <h3 className="font-bold text-2xl text-transparent bg-clip-text bg-linear-to-r from-pink-400 to-cyan-400">
                                        {t("diff.modal_update_title")}
                                    </h3>
                                </div>

                                <div className="px-6 pb-6">
                                    <div className="w-full p-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-center items-center text-sm text-white/80">
                                                <span className="font-bold text-lg text-accent">{stageType}:</span>
                                                <div className="flex items-center gap-4 ml-2">
                                                    {stageType !== 'Cut Data' && <span className="text-white font-bold">{progressUpdate.toFixed(0)} / {maxProgressUpdate.toFixed(0)}</span>}
                                                    {stageType === 'Cut Data' && <span className="text-white font-bold truncate max-w-full overflow-hidden whitespace-nowrap">{messageUpdate}</span>}
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-linear-to-r from-pink-400 via-violet-400 to-sky-400 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(progressUpdate / maxProgressUpdate) * 100}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <div className="text-center text-lg text-white/60">
                                                {t("diff.status_wait")}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-info/5 rounded-lg p-4 border border-info/30 mt-6">
                        <h3 className="font-medium text-error mb-2">{t("diff.inst_title")}</h3>
                        <ol className="text-sm text-error space-y-1">
                            <li>{t("diff.inst_step_1")}</li>
                            <li>{t("diff.inst_step_2")}</li>
                            <li>{t("diff.inst_step_3")}</li>
                            <li>{t("diff.inst_step_4")}</li>
                            <li>{t("diff.inst_step_5")}</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    )
}