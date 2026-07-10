// Field-level validation primitives shared by client forms and API routes.
// Every validator returns { isValid, value (normalized), error }.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ok = (value) => ({ isValid: true, value, error: null })
const fail = (value, error) => ({ isValid: false, value, error })

// Placeholder junk: no letters/digits at all ("!!!!", "...."), or one
// character repeated for the whole value ("aaaaaa").
export function isPlaceholderText(value) {
    return /^[^\p{L}\p{N}]+$/u.test(value) || /^(.)\1{2,}$/u.test(value)
}

export function validateRequiredString(raw, label, { min = 1, max = 500, multiline = false } = {}) {
    const trimmed = typeof raw === 'string' ? raw.trim() : ''
    // Collapse runs of whitespace on single-line fields; keep newlines in textareas.
    const value = multiline ? trimmed : trimmed.replace(/\s+/g, ' ')
    if (!value) return fail(value, `${label} is required`)
    if (value.length < min) return fail(value, `${label} must be at least ${min} characters`)
    if (value.length > max) return fail(value, `${label} must be ${max} characters or fewer`)
    if (isPlaceholderText(value)) return fail(value, `${label} doesn't look valid`)
    return ok(value)
}

export function validateEmail(raw) {
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!value) return fail(value, 'Email is required')
    if (value.length > 200 || !EMAIL_PATTERN.test(value)) {
        return fail(value, 'Enter a valid email address')
    }
    return ok(value)
}

const MAX_PRICE = 1_000_000

export function validatePrice(raw, label = 'Price') {
    const value = typeof raw === 'string' ? Number(raw.trim()) : Number(raw)
    if (raw === '' || raw === null || raw === undefined || Number.isNaN(value)) {
        return fail(value, `${label} must be a number`)
    }
    if (!Number.isFinite(value)) return fail(value, `${label} is not a valid amount`)
    if (value <= 0) return fail(value, `${label} must be greater than zero`)
    if (value > MAX_PRICE) return fail(value, `${label} is unreasonably large`)
    return ok(value)
}

export function validateStock(raw, label = 'Stock') {
    const value = typeof raw === 'string' ? Number(raw.trim()) : Number(raw)
    if (!Number.isInteger(value)) return fail(value, `${label} must be a whole number`)
    if (value < 0) return fail(value, `${label} cannot be negative`)
    return ok(value)
}

export function validateDiscount(raw, label = 'Discount') {
    const value = typeof raw === 'string' ? Number(raw.trim()) : Number(raw)
    if (raw === '' || raw === null || raw === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
        return fail(value, `${label} must be a number`)
    }
    if (value <= 0 || value > 100) return fail(value, `${label} must be between 0 and 100`)
    return ok(value)
}

export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
]
const MAX_IMAGE_SIZE_MB = 10

export function validateImageFile(file, { label = 'Image', required = true } = {}) {
    const isFile = typeof File !== 'undefined' && file instanceof File
    if (!isFile || file.size === 0) {
        return required
            ? fail(file, `Please choose a ${label.toLowerCase()} to upload`)
            : ok(null)
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return fail(file, `${label} must be a JPEG, PNG, WebP, GIF or AVIF image`)
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        return fail(file, `${label} must be smaller than ${MAX_IMAGE_SIZE_MB}MB`)
    }
    return ok(file)
}
