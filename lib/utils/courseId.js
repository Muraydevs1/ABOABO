export const COURSE_ID_PATTERN = /^[A-Z]{3}\/\d{4}\/\d{2}$/;

export function normalizeCourseId(value = "") {
    return value.trim().toUpperCase();
}

export function validateCourseId(value = "") {
    const courseId = normalizeCourseId(value);

    if (!courseId) {
        return { isValid: false, courseId, error: "Course ID is required" };
    }

    if (courseId.length > 11) {
        return { isValid: false, courseId, error: "Invalid Course ID" };
    }

    if (!COURSE_ID_PATTERN.test(courseId)) {
        return {
            isValid: false,
            courseId,
            error: "Invalid course ID format. Example: DSP/0001/23",
        };
    }

    return { isValid: true, courseId, error: null };
}
