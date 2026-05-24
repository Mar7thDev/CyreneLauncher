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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-50/30 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="relative w-[90%] max-w-lg bg-white/95 backdrop-blur-xl text-base-content rounded-2xl border border-pink-200/60 shadow-2xl shadow-pink-200/40"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="btn btn-circle btn-sm bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-400 absolute right-3 top-3"
          onClick={onClose}
        >
          ✕
        </motion.button>

        <div className="border-b border-pink-100 px-6 py-4 mb-4">
          <h3 className="font-bold text-2xl text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-sky-500">
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
                    ? "bg-linear-to-r from-pink-500 to-sky-500 border-none text-white shadow-md shadow-pink-200/50"
                    : btn.variant === "error"
                    ? "bg-white hover:bg-red-50 border border-red-200 text-red-400"
                    : "bg-white hover:bg-pink-50 border border-pink-200 text-pink-500"
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
