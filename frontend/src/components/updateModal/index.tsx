import { motion } from "motion/react"

interface UpdateModalProps {
    isOpen: boolean
    title: string
    message: string
    buttons: {
      text: string
      onClick: () => Promise<void> | void
      variant?: "primary" | "error" | "outline"
    }[]
    onClose: () => void
  }

export default function UpdateModal({ isOpen, title, message, buttons, onClose }: UpdateModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center launcher-themed-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="relative w-[90%] max-w-lg launcher-card text-base-content rounded-2xl"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="btn btn-circle btn-sm launcher-soft-button absolute right-3 top-3"
          onClick={onClose}
        >
          ✕
        </motion.button>

        <div className="border-b launcher-soft-border px-6 py-4 mb-4">
          <h3 className="font-bold text-2xl text-transparent bg-clip-text launcher-gradient-text">
            {title}
          </h3>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <p className="text-base-content/70 text-base">{message}</p>
          </div>

          <div className="flex justify-end gap-3">
            {buttons.map((btn, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`btn ${
                  btn.variant === "primary"
                    ? "launcher-gradient border-none text-white launcher-gradient-shadow"
                    : btn.variant === "error"
                    ? "launcher-danger-button"
                    : "launcher-outline-button"
                }`}
                onClick={btn.onClick}
              >
                {btn.text}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
