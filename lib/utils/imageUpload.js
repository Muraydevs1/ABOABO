// Client-side image preparation, run before validation/upload.
// - iPhone HEIC/HEIF photos are converted to JPEG (WebKit — every iOS
//   browser — decodes HEIC in a canvas, so no conversion library is needed).
// - Oversized JPEG/PNG/WebP files are downscaled and re-encoded so uploads
//   stay fast on mobile data.
// - Everything else (normal JPEG/PNG/WebP, GIF, AVIF) passes through untouched.
// Browser-only: relies on Image/canvas; never import from server code.

const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
// Some browsers report HEIC with an empty MIME type, so check the name too.
export function isHeicFile(file) {
    if (!(file instanceof File)) return false
    return HEIC_TYPES.includes((file.type || '').toLowerCase()) || /\.hei[cf]$/i.test(file.name || '')
}

const MAX_DIMENSION = 2000
const COMPRESS_THRESHOLD_BYTES = 4 * 1024 * 1024
const JPEG_QUALITY = 0.85
const RECOMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// <img> decoding applies EXIF orientation automatically in all modern
// browsers, so the canvas re-encode below bakes the correct rotation in.
const loadImage = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode-failed')) }
    img.src = url
})

const toJpegFile = (img, originalName) => new Promise((resolve, reject) => {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight, 1))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    // JPEG has no alpha channel — flatten any transparency onto white
    // instead of the default black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('encode-failed'))
        const name = `${(originalName || 'image').replace(/\.\w+$/, '')}.jpg`
        resolve(new File([blob], name, { type: 'image/jpeg' }))
    }, 'image/jpeg', JPEG_QUALITY)
})

/**
 * Prepare a picked file for upload. Returns the original File when no work
 * is needed; returns a converted/compressed JPEG File otherwise. Throws a
 * user-friendly Error only when a HEIC file cannot be decoded (non-WebKit
 * desktop browsers).
 */
export async function prepareImageForUpload(file) {
    if (!(file instanceof File) || file.size === 0) return file

    const heic = isHeicFile(file)
    const oversized = file.size > COMPRESS_THRESHOLD_BYTES
        && RECOMPRESSIBLE_TYPES.includes((file.type || '').toLowerCase())

    if (!heic && !oversized) return file

    try {
        const img = await loadImage(file)
        return await toJpegFile(img, file.name)
    } catch {
        if (heic) {
            throw new Error("This photo is in HEIC format and couldn't be converted in this browser. Please choose a JPEG or PNG copy instead.")
        }
        // Oversized but re-encoding failed: hand back the original and let
        // the normal size validation produce its message.
        return file
    }
}
