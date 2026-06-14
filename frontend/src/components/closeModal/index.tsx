import { motion } from "motion/react"
import { AppService } from "@bindings/cyrene-launcher/internal/app-service"
import { toast } from "react-toastify"
import useSettingStore from "@/stores/settingStore"
import { useTranslation } from "react-i18next"

export default function CloseModal({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    if (!isOpen) return null
    const { closingOption, setClosingOption } = useSettingStore()
    const { t } = useTranslation()

    return (
        <div className="fixed inset-0 z-50 h-full flex items-center justify-center launcher-themed-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="relative w-[90%] max-w-md launcher-card text-base-content rounded-2xl"
            >
                <div className="border-b launcher-soft-border px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-transparent bg-clip-text launcher-gradient-text">
                        {t("close.title")}
                    </h3>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                        className="btn btn-circle btn-sm launcher-soft-button"
                        onClick={onClose}
                    >
                        ✕
                    </motion.button>
                </div>

                <div className="px-6 pt-4 pb-6 space-y-4">
                    <p className="text-base text-base-content/70">
                        {t("close.description")}
                    </p>

                    <div className="flex items-center gap-2">
                        <input
                            id="dontAskAgain"
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={!closingOption.isAsk}
                            onChange={(e) => setClosingOption({ isMinimize: closingOption.isMinimize, isAsk: !e.target.checked })}
                        />
                        <label htmlFor="dontAskAgain" className="text-sm text-base-content/60 cursor-pointer">
                            {t("close.dont_ask")}
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            className="btn launcher-gradient border-none text-white launcher-gradient-shadow transition-shadow"
                            onClick={async () => {
                                onClose()
                                const [success, message] = await AppService.HideApp()
                                if (!success) toast.error(message)
                                if (!closingOption.isAsk) {
                                    setClosingOption({ isMinimize: true, isAsk: false })
                                }
                            }}
                        >
                            {t("close.minimize")}
                        </button>
                        <button
                            className="btn launcher-danger-button transition-all"
                            onClick={async () => {
                                onClose()
                                const [success, message] = await AppService.CloseApp()
                                if (!success) toast.error(message)
                                if (!closingOption.isAsk) {
                                    setClosingOption({ isMinimize: false, isAsk: false })
                                }
                            }}
                        >
                            {t("close.close")}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
