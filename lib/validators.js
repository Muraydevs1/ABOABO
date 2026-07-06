// Reusable server-side validators. Never trust client-side validation.
import { validateCourseId } from "@/lib/utils/courseId";

const ALLOWED_CAMPUSES = ["Nyankpala", "Dungu", "City"];

const MAX_NAME_LENGTH = 100;
const MAX_HOSTEL_LENGTH = 120;
const MAX_EMAIL_LENGTH = 200;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{9,15}$/;

/**
 * Validate + allow-list an address payload. Returns only the accepted, normalized
 * fields (mass-assignment safe) — any unexpected properties are dropped.
 * @returns {{ valid: true, value: object } | { valid: false, error: string }}
 */
export function validateAddress(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { valid: false, error: "Invalid address payload" };
    }

    const fields = {
        name: raw.name,
        email: raw.email,
        campus: raw.campus,
        hostel: raw.hostel,
        course: raw.course,
        phone: raw.phone,
    };

    for (const [field, value] of Object.entries(fields)) {
        if (typeof value !== "string" || !value.trim()) {
            return { valid: false, error: `Missing or invalid field: ${field}` };
        }
    }

    const name = fields.name.trim();
    const email = fields.email.trim();
    const campus = fields.campus.trim();
    const hostel = fields.hostel.trim();

    if (name.length > MAX_NAME_LENGTH) return { valid: false, error: "Name is too long" };
    if (hostel.length > MAX_HOSTEL_LENGTH) return { valid: false, error: "Hostel is too long" };
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
        return { valid: false, error: "Invalid email address" };
    }
    if (!ALLOWED_CAMPUSES.includes(campus)) {
        return { valid: false, error: "Invalid campus selected" };
    }

    const { isValid, courseId, error } = validateCourseId(fields.course);
    if (!isValid) return { valid: false, error };

    const phone = fields.phone.replace(/[\s-]/g, "");
    if (!PHONE_PATTERN.test(phone)) {
        return { valid: false, error: "Invalid phone number" };
    }

    return {
        valid: true,
        value: { name, email, campus, hostel, course: courseId, phone },
    };
}

const MAX_CART_DISTINCT_ITEMS = 100;
const MAX_CART_ITEM_QUANTITY = 100;
const MAX_PRODUCT_ID_LENGTH = 100;

/**
 * Validate a cart object of shape { [productId: string]: quantity: number }.
 * Rejects arrays, malformed entries, and oversized payloads. Returns a cleaned,
 * integer-normalized copy.
 * @returns {{ valid: true, value: object } | { valid: false, error: string }}
 */
export function validateCart(cart) {
    if (!cart || typeof cart !== "object" || Array.isArray(cart)) {
        return { valid: false, error: "Invalid cart payload" };
    }

    const entries = Object.entries(cart);

    if (entries.length > MAX_CART_DISTINCT_ITEMS) {
        return { valid: false, error: "Cart has too many items" };
    }

    const cleaned = {};
    for (const [productId, quantity] of entries) {
        if (typeof productId !== "string" || productId.length === 0 || productId.length > MAX_PRODUCT_ID_LENGTH) {
            return { valid: false, error: "Invalid product id in cart" };
        }
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_CART_ITEM_QUANTITY) {
            return { valid: false, error: "Invalid quantity in cart" };
        }
        cleaned[productId] = qty;
    }

    return { valid: true, value: cleaned };
}
