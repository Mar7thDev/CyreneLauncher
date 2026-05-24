'use client'

import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Plus, Upload, Check } from 'lucide-react'
import useSettingStore from '@/stores/settingStore'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/cropImage'
import { useTranslation } from 'react-i18next'
import { toast } from "react-toastify"

const initialImages = {
  "bg-17": "bg-17.jpg",
  "bg-11": "bg-11.jpeg",
  "bg-1": "bg-1.jpeg",
  "bg-2": "bg-2.png",
  "bg-3": "bg-3.png",
  "bg-6": "bg-6.png",
  "bg-7": "bg-7.jpeg",
  "bg-8": "bg-8.png",
  "bg-9": "bg-9.jpeg",
  "bg-10": "bg-10.jpg",
  "bg-12": "bg-12.jpg",
  "bg-13": "bg-13.jpg",
  "bg-16": "bg-16.jpg",
}

export const BackgroundSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const { background, setBackground, extraBackgrounds, setExtraBackgrounds } = useSettingStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const handleSelect = (img: string) => {
    setIsOpen(false)
    setBackground(img)
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

  const allBackgrounds = [...extraBackgrounds, ...Object.values(initialImages)]

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <div className="tooltip tooltip-right" data-tip={t("background.select_bg")}>
        <button
          className="group btn btn-primary btn-circle flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-primary/80"
          onClick={() => setIsOpen(true)}
        >
          <ImageIcon size={22} className="transition-all duration-300 group-hover:rotate-6 group-hover:scale-110" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-pink-50/40 backdrop-blur-md pt-10">
          <div className="bg-white/95 backdrop-blur-xl text-base-content rounded-2xl shadow-2xl shadow-pink-100/50 border border-pink-200/60 p-6 w-[90%] max-w-2xl relative">
            <button className="btn btn-ghost btn-circle absolute top-3 right-3" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4">{t("background.choose_bg")}</h2>

            {/* Add via URL */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder={t("background.paste_url")}
                className="input input-bordered w-full text-info"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button className="btn btn-success flex items-center gap-1" onClick={handleAddUrl}>
                <Plus size={16} /> {t("background.add")}
              </button>
            </div>

            {/* Upload from computer */}
            <div className="flex mb-4">
              <button
                className="btn btn-warning flex items-center gap-1"
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
              <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/70 p-4">
                <div className="relative w-full max-w-5xl h-150 bg-gray-800 rounded-lg">
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
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 btn btn-success"
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
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${value === background ? 'border-pink-400 shadow-md shadow-pink-200/50' : 'border-transparent hover:border-pink-200'
                      }`}
                    onClick={() => handleSelect(value)}
                  >
                    <img src={value} alt={`bg-${i}`} loading="lazy" className="w-full h-28 object-cover" />
                    {isExtra && (
                      <button
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
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

