// Client-side image preparation, run before validation/upload.
// - iPhone HEIC/HEIF photos are converted to JPEG (WebKit — every iOS
//   browser — decodes HEIC in a canvas, so no conversion library is needed).
// - Oversized JPEG/PNG/WebP files are downscaled and re-encoded so uploads
//   stay fast on mobile data.
// - Everything else (normal JPEG/PNG/WebP, GIF, AVIF) passes through untouched.
// Browser-only: relies on Image/canvas; never import from server code.

const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])
const HEIC_EXTENSIONS = new Set(['heic', 'heif', 'heics', 'hif'])
// Browsers derive file.type from OS mappings, which are often missing or
// generic for HEIC (especially Chrome on Windows/Linux).
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream'])

const fileExtension = (name) => {
    const match = /\.([a-z0-9]+)$/i.exec(name || '')
    return match ? match[1].toLowerCase() : ''
}

// Multi-signal HEIC detection: trust a declared HEIC MIME type; when the
// browser reports no/generic MIME, fall back to the filename extension.
// A declared non-HEIC image type (e.g. image/jpeg) is trusted as-is.
export function isHeicFile(file) {
    if (!(file instanceof File)) return false
    const type = (file.type || '').toLowerCase()
    if (HEIC_MIME_TYPES.has(type)) return true
    if (GENERIC_MIME_TYPES.has(type)) return HEIC_EXTENSIONS.has(fileExtension(file.name))
    return false
}

// TEMPORARY DIAGNOSTICS (dev only) — safe to delete before production.
const logImagePrep = (file, detectedHeic, outcome) => {
    if (process.env.NODE_ENV === 'production') return
    console.debug('[image-prep]', {
        browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        name: file.name,
        type: file.type || '(empty)',
        extension: fileExtension(file.name) || '(none)',
        detectedHeic,
        outcome,
    })
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
 * Prepare a picked file for upload. Returns a converted/compressed JPEG when
 * the browser can decode the file (Safari happy path), otherwise returns the
 * original File so the upload can continue — ImageKit converts HEIC to WebP
 * at ingest, so a failed local conversion must never block the upload.
 * Never throws for HEIC; check `isHeicFile` on the result to know whether a
 * local preview is possible.
 */
export async function prepareImageForUpload(file) {
    if (!(file instanceof File) || file.size === 0) return file

    const heic = isHeicFile(file)
    const oversized = file.size > COMPRESS_THRESHOLD_BYTES
        && RECOMPRESSIBLE_TYPES.includes((file.type || '').toLowerCase())

    if (!heic && !oversized) {
        logImagePrep(file, heic, 'untouched')
        return file
    }

    try {
        const img = await loadImage(file)
        const converted = await toJpegFile(img, file.name)
        logImagePrep(file, heic, 'converted-to-jpeg')
        return converted
    } catch {
        // Browser can't decode this file (e.g. HEIC on Chrome). Pass the
        // original through — ImageKit handles the conversion server-side.
        logImagePrep(file, heic, 'fallback-original')
        return file
    }
}
