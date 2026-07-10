export const COURSE_ID_PATTERN = /^[A-Z]{3}\/\d{4}\/\d{2}$/;

// UDS admissions open around September. Before that month, the current
// year's cohort does not exist yet, so its two-digit year is "future".
const ADMISSION_START_MONTH = 8; // 0-based: 8 = September

export function latestValidAdmissionYear(now = new Date()) {
    const admissionsStarted = now.getMonth() >= ADMISSION_START_MONTH;
    return (now.getFullYear() - (admissionsStarted ? 0 : 1)) % 100;
}

export function normalizeCourseId(value = "") {
    return value.trim().toUpperCase();
}

/**
 * Validate a UDS Course ID (AAA/1234/YY, e.g. CSC/0012/23) with a dynamic
 * admission-year check. Lowercase input is normalized before validation.
 * @returns {{ isValid: boolean, courseId: string, error: string | null }}
 */
export function validateCourseId(value = "") {
    const courseId = normalizeCourseId(value);
    const fail = (error) => ({ isValid: false, courseId, error });

    if (!courseId) {
        return fail("Course ID is required");
    }

    // Structure check with targeted messages for the common mistakes.
    if (!COURSE_ID_PATTERN.test(courseId)) {
        const parts = courseId.split("/");
        if (parts.length !== 3) {
            return fail("Course ID must follow the format CSC/0012/23");
        }
        if (!/^[A-Z]{3}$/.test(parts[0])) {
            return fail("Course initials must contain exactly three letters");
        }
        if (!/^\d{4}$/.test(parts[1])) {
            return fail("The middle section must be exactly four digits, e.g. 0012");
        }
        return fail("The admission year must be exactly two digits, e.g. 23");
    }

    // Belt-and-braces: the pattern above already implies this.
    if (courseId.length !== 11) {
        return fail("Course ID must be exactly 11 characters, e.g. CSC/0012/23");
    }

    const admissionYear = Number(courseId.slice(-2));
    if (admissionYear > latestValidAdmissionYear()) {
        return fail("Admission year cannot be in the future");
    }

    return { isValid: true, courseId, error: null };
}
