// Reusable validators shared by client forms (inline errors) and API routes.
// Never trust client-side validation: every route re-runs these composites.
//
// Composites return { valid, value, errors } where `value` holds only the
// accepted, normalized fields (mass-assignment safe) and `errors` maps
// field -> friendly message. `firstError` gives the API a single message.
import { validateCourseId } from "@/lib/utils/courseId";
import { validateGhanaPhone } from "@/lib/utils/phone";
import { CAMPUS_OPTIONS, PRODUCT_CATEGORIES } from "@/lib/constants";
import {
    validateRequiredString,
    validateEmail,
    validatePrice,
    validateDiscount,
    validateImageFile,
} from "@/lib/utils/fieldValidation";

export const firstError = (errors) => Object.values(errors)[0] || "Invalid input";

/**
 * Validate + allow-list an address payload (checkout / delivery details).
 * @returns {{ valid: true, value: object } | { valid: false, error: string, errors: object }}
 */
export function validateAddress(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { valid: false, error: "Invalid address payload", errors: {} };
    }

    const errors = {};
    const value = {};

    const name = validateRequiredString(raw.name, "Name", { min: 2, max: 100 });
    if (!name.isValid) errors.name = name.error; else value.name = name.value;

    const email = validateEmail(raw.email);
    if (!email.isValid) errors.email = email.error; else value.email = email.value;

    if (!CAMPUS_OPTIONS.includes(typeof raw.campus === "string" ? raw.campus.trim() : "")) {
        errors.campus = "Please select a campus";
    } else value.campus = raw.campus.trim();

    const hostel = validateRequiredString(raw.hostel, "Hostel", { min: 2, max: 120 });
    if (!hostel.isValid) errors.hostel = hostel.error; else value.hostel = hostel.value;

    const course = validateCourseId(raw.course || "");
    if (!course.isValid) errors.course = course.error; else value.course = course.courseId;

    const phone = validateGhanaPhone(raw.phone || "");
    if (!phone.isValid) errors.phone = phone.error; else value.phone = phone.phone;

    if (Object.keys(errors).length) {
        return { valid: false, error: firstError(errors), errors };
    }
    return { valid: true, value };
}

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,28})[a-z0-9]$/;

/**
 * Validate a store application (create-store form / POST /api/store/create).
 * `image` should be the uploaded File (client and server both receive one).
 */
export function validateStoreSubmission(raw) {
    const errors = {};
    const value = {};

    const checks = [
        ["name", validateRequiredString(raw.name, "Store name", { min: 2, max: 100 })],
        ["description", validateRequiredString(raw.description, "Description", { min: 10, max: 2000, multiline: true })],
        ["address", validateRequiredString(raw.address, "Address", { min: 5, max: 500, multiline: true })],
        ["email", validateEmail(raw.email)],
    ];
    for (const [field, result] of checks) {
        if (!result.isValid) errors[field] = result.error;
        else value[field] = result.value;
    }

    const username = typeof raw.username === "string" ? raw.username.trim().toLowerCase() : "";
    if (!USERNAME_PATTERN.test(username)) {
        errors.username = "Username must be 3-30 characters: letters, numbers, dots, dashes or underscores";
    } else value.username = username;

    if (!CAMPUS_OPTIONS.includes(typeof raw.campus === "string" ? raw.campus.trim() : "")) {
        errors.campus = "Please select a campus";
    } else value.campus = raw.campus.trim();

    const course = validateCourseId(raw.course || "");
    if (!course.isValid) errors.course = course.error; else value.course = course.courseId;

    const contact = validateGhanaPhone(raw.contact || "");
    if (!contact.isValid) errors.contact = contact.error; else value.contact = contact.phone;

    const image = validateImageFile(raw.image, { label: "Store logo", required: true });
    if (!image.isValid) errors.image = image.error; else value.image = image.value;

    if (Object.keys(errors).length) {
        return { valid: false, error: firstError(errors), errors };
    }
    return { valid: true, value };
}

const MAX_PRODUCT_IMAGES = 4;

/**
 * Validate a new product (add-product form / POST /api/store/product).
 * `images` is an array of Files.
 */
export function validateProductSubmission(raw) {
    const errors = {};
    const value = {};

    const name = validateRequiredString(raw.name, "Product name", { min: 2, max: 150 });
    if (!name.isValid) errors.name = name.error; else value.name = name.value;

    const description = validateRequiredString(raw.description, "Description", { min: 10, max: 5000, multiline: true });
    if (!description.isValid) errors.description = description.error; else value.description = description.value;

    const mrp = validatePrice(raw.mrp, "Actual price");
    if (!mrp.isValid) errors.mrp = mrp.error; else value.mrp = mrp.value;

    const price = validatePrice(raw.price, "Offer price");
    if (!price.isValid) errors.price = price.error; else value.price = price.value;

    if (!PRODUCT_CATEGORIES.includes(raw.category)) {
        errors.category = "Please select a category";
    } else value.category = raw.category;

    const images = Array.isArray(raw.images) ? raw.images : [];
    if (images.length === 0) {
        errors.images = "Please upload at least one product image";
    } else if (images.length > MAX_PRODUCT_IMAGES) {
        errors.images = `You can upload at most ${MAX_PRODUCT_IMAGES} images`;
    } else {
        for (const file of images) {
            const image = validateImageFile(file, { label: "Product image", required: true });
            if (!image.isValid) {
                errors.images = image.error;
                break;
            }
        }
        if (!errors.images) value.images = images;
    }

    if (Object.keys(errors).length) {
        return { valid: false, error: firstError(errors), errors };
    }
    return { valid: true, value };
}

const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/;

/**
 * Validate + allow-list a coupon payload (admin form / POST /api/admin/coupon).
 */
export function validateCoupon(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { valid: false, error: "Invalid coupon payload", errors: {} };
    }

    const errors = {};
    const value = {};

    const code = typeof raw.code === "string" ? raw.code.trim().toUpperCase() : "";
    if (!COUPON_CODE_PATTERN.test(code)) {
        errors.code = "Code must be 3-20 characters: letters, numbers, dashes or underscores";
    } else value.code = code;

    const description = validateRequiredString(raw.description, "Description", { min: 3, max: 200 });
    if (!description.isValid) errors.description = description.error; else value.description = description.value;

    const discount = validateDiscount(raw.discount);
    if (!discount.isValid) errors.discount = discount.error; else value.discount = discount.value;

    const expiresAt = new Date(raw.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
        errors.expiresAt = "Enter a valid expiry date";
    } else if (expiresAt.getTime() < Date.now()) {
        errors.expiresAt = "Expiry date must be in the future";
    } else value.expiresAt = expiresAt;

    value.forNewUser = Boolean(raw.forNewUser);
    value.forMember = Boolean(raw.forMember);
    value.isPublic = Boolean(raw.isPublic);

    if (Object.keys(errors).length) {
        return { valid: false, error: firstError(errors), errors };
    }
    return { valid: true, value };
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
