// Lightweight, dependency-free per-key rate limiter (fixed window).
//
// Designed to be reusable across routes and easy to swap for a distributed
// store (e.g. Upstash Redis) later without changing call sites: keep the
// { success, retryAfterMs } return shape and replace the internals.
//
// NOTE: state is in-process memory. On a single long-lived server this is
// effective. On horizontally-scaled / serverless deploys each instance keeps
// its own counters, so limits are approximate — good enough to blunt abuse and
// runaway cost, but move to Redis if you need exact global limits.

const buckets = new Map(); // key -> { count, resetAt }
const MAX_TRACKED_KEYS = 10000;

function prune(now) {
    for (const [key, entry] of buckets) {
        if (now >= entry.resetAt) buckets.delete(key);
    }
}

/**
 * @param {object} opts
 * @param {string} opts.key      Unique identifier to limit on (e.g. `ai:<userId>`).
 * @param {number} opts.limit    Max requests allowed per window.
 * @param {number} opts.windowMs Window length in milliseconds.
 * @returns {{ success: boolean, remaining: number, resetAt: number, retryAfterMs: number }}
 */
export function rateLimit({ key, limit, windowMs }) {
    const now = Date.now();

    if (buckets.size > MAX_TRACKED_KEYS) prune(now);

    const entry = buckets.get(key);

    if (!entry || now >= entry.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: limit - 1, resetAt: now + windowMs, retryAfterMs: 0 };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt, retryAfterMs: entry.resetAt - now };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt, retryAfterMs: 0 };
}

/** Standard 429 response with a Retry-After header. Works with any route handler. */
export function tooManyRequestsResponse(retryAfterMs) {
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return new Response(
        JSON.stringify({ error: "Too many requests. Please slow down and try again shortly." }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfterSec),
            },
        }
    );
}
