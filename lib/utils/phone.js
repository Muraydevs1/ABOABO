// Ghanaian mobile number validation. Shared by client forms (inline errors)
// and API routes (never trust the client).

// MTN: 024/025/053/054/055/059 · Telecel: 020/050 · AirtelTigo: 026/027/056/057
const GH_MOBILE_PREFIXES = [
    '020', '024', '025', '026', '027',
    '050', '053', '054', '055', '056', '057', '059',
]

/**
 * Validate a Ghanaian mobile number and normalize it to local format
 * (0XXXXXXXXX). Accepts 0241234567, +233241234567 and 233241234567.
 * @returns {{ isValid: true, phone: string, error: null }
 *         | { isValid: false, phone: string, error: string }}
 */
export function validateGhanaPhone(raw) {
    const input = typeof raw === 'string' ? raw.replace(/\s+/g, '') : ''
    const fail = (error) => ({ isValid: false, phone: input, error })

    if (!input) return fail('Phone number is required')
    // One optional leading +, then digits only — letters, punctuation and
    // extra + signs are rejected rather than silently stripped.
    if (!/^\+?\d+$/.test(input)) {
        return fail('Phone number can only contain digits (e.g. 0241234567)')
    }

    // Normalize +233 / 233 international forms to local 0-prefixed form.
    let phone = input
    if (phone.startsWith('+233')) phone = `0${phone.slice(4)}`
    else if (phone.startsWith('233')) phone = `0${phone.slice(3)}`

    if (phone.length !== 10 || !phone.startsWith('0')) {
        return fail('Phone number must be 10 digits, e.g. 0241234567')
    }
    if (!GH_MOBILE_PREFIXES.includes(phone.slice(0, 3))) {
        return fail(`${phone.slice(0, 3)}… is not a valid Ghanaian mobile prefix`)
    }

    return { isValid: true, phone, error: null }
}
