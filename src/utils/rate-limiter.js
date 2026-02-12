// file: /src/utils/rate-limiter.js v1 - In-memory rate limiter for registration spam protection

/**
 * Simple in-memory rate limiter using Map
 * Note: On Vercel serverless, each cold start gets a fresh Map.
 * This still helps because within a warm instance, rapid-fire
 * requests from the same IP will be caught. For persistent
 * rate limiting across instances, use Redis/Upstash in the future.
 */

const rateLimitMap = new Map();

// Clean up old entries every 10 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    for (const [key, value] of rateLimitMap.entries()) {
        if (now - value.firstRequest > value.windowMs) {
            rateLimitMap.delete(key);
        }
    }
}

/**
 * Check if a request should be rate limited
 * @param {string} identifier - Usually the IP address
 * @param {number} maxRequests - Max requests allowed in the window (default: 5)
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns {{ limited: boolean, remaining: number, retryAfterMs: number }}
 */
export function checkRateLimit(identifier, maxRequests = 5, windowMs = 15 * 60 * 1000) {
    cleanup();

    const now = Date.now();
    const key = `register:${identifier}`;

    const entry = rateLimitMap.get(key);

    if (!entry) {
        // First request from this identifier
        rateLimitMap.set(key, {
            count: 1,
            firstRequest: now,
            windowMs: windowMs
        });
        return { limited: false, remaining: maxRequests - 1, retryAfterMs: 0 };
    }

    // Check if the window has expired
    if (now - entry.firstRequest > windowMs) {
        // Reset the window
        rateLimitMap.set(key, {
            count: 1,
            firstRequest: now,
            windowMs: windowMs
        });
        return { limited: false, remaining: maxRequests - 1, retryAfterMs: 0 };
    }

    // Within the window — increment count
    entry.count += 1;

    if (entry.count > maxRequests) {
        const retryAfterMs = windowMs - (now - entry.firstRequest);
        return {
            limited: true,
            remaining: 0,
            retryAfterMs: retryAfterMs
        };
    }

    return {
        limited: false,
        remaining: maxRequests - entry.count,
        retryAfterMs: 0
    };
}

/**
 * Get the client IP from a Next.js request
 * Works with Vercel's forwarded headers
 * @param {Request} request - The incoming request
 * @returns {string} The client IP address
 */
export function getClientIP(request) {
    // Vercel provides the real IP in x-forwarded-for
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs: client, proxy1, proxy2
        return forwarded.split(',')[0].trim();
    }

    // Fallback headers
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;

    // Last resort
    return 'unknown';
}