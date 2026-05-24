
export default function getCroppedImg(imageSrc: string, crop: any): Promise<string> {
  const image = new Image()
  image.crossOrigin = "anonymous"
  image.src = imageSrc
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = crop.width
  canvas.height = crop.height
  return new Promise((resolve) => {
    image.onload = () => {
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      )
      resolve(canvas.toDataURL('image/jpeg'))
    }
  })
}
