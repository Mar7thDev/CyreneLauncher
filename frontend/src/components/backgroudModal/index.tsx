'use client'

import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Plus, Upload, Check } from 'lucide-react'
import useSettingStore from '@/stores/settingStore'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/cropImage'
import { useTranslation } from 'react-i18next'
import { toast } from "react-toastify"
import { motion } from 'motion/react'
import { features } from '@/config/features'
import { launcherConfig } from '@/config/launcher'

const initialImages = launcherConfig.backgroundOptions

export const BackgroundSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const {
    background, setBackground,
    starRailBackground, setStarRailBackground,
    gameProfile, setGameProfile,
    extraBackgrounds, setExtraBackgrounds,
  } = useSettingStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const handleSelect = (img: string) => {
    setIsOpen(false)
    setBackground(img)
    if (gameProfile === "starrail") {
      setStarRailBackground(img)
    }
  }

  const handleGameSelect = (profile: "genshin" | "starrail") => {
    setGameProfile(profile)
    if (profile === "genshin") {
      setBackground(launcherConfig.genshinBackground)
      return
    }
    setBackground(starRailBackground || launcherConfig.starRailBackground)
  }
  const isImageUrl = (url: string) => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)
  }
  const handleAddUrl = () => {
    const url = newUrl.trim()
    if (!url) {
      return
    }

    if (!isImageUrl(url)) {
      toast.error(t("background.invalid_url"))
      return
    }

    setCroppingImage(url)
    setNewUrl('')
  }

  const handleRemoveExtra = (url: string) => {
    setExtraBackgrounds(extraBackgrounds.filter(bg => bg !== url))
  }

  const handleUploadFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setCroppingImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async () => {
    if (!croppingImage || !croppedAreaPixels) return
    const croppedBase64 = await getCroppedImg(croppingImage, croppedAreaPixels)
    setExtraBackgrounds([croppedBase64, ...extraBackgrounds])
    setCroppingImage(null)
  }

  const allBackgrounds = [...extraBackgrounds, ...initialImages]

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      {features.gameProfileSwitcher && (
        <div className="flex flex-col items-center gap-3">
          {([
            { id: "genshin", icon: "game-genshin.png", label: t("home.game_profile_genshin") },
            { id: "starrail", icon: "game-starrail.png", label: t("home.game_profile_starrail") },
          ] as const).map((game) => {
            const isActive = gameProfile === game.id
            return (
              <div key={game.id} className="tooltip tooltip-right" data-tip={game.label}>
                <motion.button
                  type="button"
                  whileHover={{ y: -5, scale: 1.08 }}
                  whileTap={{ scale: 0.92, opacity: 0.62 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                  onClick={() => handleGameSelect(game.id)}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white/65 backdrop-blur-md launcher-soft-shadow transition-all duration-200 ${
                    isActive
                      ? "launcher-theme-border ring-2 ring-white/90"
                      : "border-white/70 launcher-soft-border-hover"
                  }`}
                  aria-label={game.label}
                >
                  <img
                    src={game.icon}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    draggable={false}
                  />
                </motion.button>
              </div>
            )
          })}
        </div>
      )}

      <div className="tooltip tooltip-right" data-tip={t("background.select_bg")}>
        <button
          className="group btn launcher-tool-button btn-circle flex items-center justify-center transition-all duration-300 hover:scale-110"
          onClick={() => setIsOpen(true)}
        >
          <ImageIcon size={22} className="transition-all duration-300 group-hover:rotate-6 group-hover:scale-110" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center launcher-themed-overlay pt-10">
          <div className="launcher-card text-base-content rounded-2xl p-6 w-[90%] max-w-2xl relative">
            <button className="btn btn-ghost btn-circle absolute top-3 right-3" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4">{t("background.choose_bg")}</h2>

            {/* Add via URL */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder={t("background.paste_url")}
                className="input launcher-input w-full"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button className="btn launcher-tool-button flex items-center gap-1" onClick={handleAddUrl}>
                <Plus size={16} /> {t("background.add")}
              </button>
            </div>

            {/* Upload from computer */}
            <div className="flex mb-4">
              <button
                className="btn launcher-outline-button flex items-center gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} /> {t("background.upload_from_computer")}
              </button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadFile(file)
                  e.target.value = ''
                }}
              />
            </div>

            {/* Crop Modal */}
            {(croppingImage != null && croppingImage != "") && (
              <div className="fixed inset-0 z-60 flex flex-col items-center justify-center launcher-crop-overlay p-4">
                <div className="relative w-full max-w-5xl h-150 launcher-crop-surface rounded-lg">
                  <Cropper
                    image={croppingImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={16 / 9}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  />
                  <button
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 btn launcher-tool-button"
                    onClick={handleCropComplete}
                  >
                    <Check size={20} /> {t("background.done")}
                  </button>
                  <button
                    className="absolute top-2 right-2 btn btn-ghost btn-circle"
                    onClick={() => setCroppingImage(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {allBackgrounds.map((value, i) => {
                const isExtra = i < extraBackgrounds.length
                return (
                  <div
                    key={i}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${value === background ? 'launcher-theme-border launcher-theme-shadow' : 'border-transparent launcher-soft-border-hover'
                      }`}
                    onClick={() => handleSelect(value)}
                  >
                    <img src={value} alt={`bg-${i}`} loading="lazy" className="w-full h-28 object-cover" />
                    {isExtra && (
                      <button
                        className="absolute top-1 right-1 launcher-thumbnail-remove rounded-full p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveExtra(value)
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
