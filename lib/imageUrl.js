// Client-safe ImageKit delivery-URL helper (pure string ops — no SDK import,
// so it is safe in client components). Rewrites the `tr` query of a stored
// ImageKit URL to request an appropriately sized variant per render surface,
// instead of serving one fixed width everywhere.
//
// Non-ImageKit URLs (e.g. Clerk avatars, external images) are returned
// unchanged. Static local imports are objects, not strings, and are ignored.

/**
 * @param {string} url            Stored image URL.
 * @param {object} [opts]
 * @param {number} [opts.width]   Target width in px (omit to leave width unset).
 * @param {string} [opts.quality] Defaults to 'auto'.
 * @param {string} [opts.format]  Defaults to 'auto' — ImageKit negotiates
 *                                AVIF/WebP/JPEG per browser via the Accept header.
 * @returns {string} A width-optimized ImageKit URL, or the original url.
 */
export function ikImage(url, { width, quality = "auto", format = "auto" } = {}) {
    if (!url || typeof url !== "string" || !url.includes("imagekit")) {
        return url;
    }

    const [base] = url.split("?");
    const params = [`q-${quality}`, `f-${format}`];
    if (width) params.push(`w-${width}`);

    return `${base}?tr=${params.join(":")}`;
}
