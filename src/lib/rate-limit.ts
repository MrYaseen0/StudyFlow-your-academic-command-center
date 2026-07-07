/**
 * Lightweight in-memory rate limiter for auth endpoints (brute-force protection).
 * Uses a sliding-window counter per identifier (IP or email).
 *
 * For multi-instance production you'd swap this for Redis-backed rate limiting,
 * but for a single-process deployment this is sufficient and zero-dependency.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Prune expired buckets every 5 minutes to prevent unbounded memory growth.
let lastPrune = Date.now();
function prune(now: number) {
  if (now - lastPrune < 5 * 60 * 1000) return;
  lastPrune = now;
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check a rate-limit bucket.
 * @param key   Identifier (IP + endpoint, or IP + email).
 * @param limit Max requests in the window.
 * @param windowMs Window size in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { ok: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Extract a best-effort client IP from a Next.js request. */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Standard rate-limit policies used across auth endpoints. */
export const POLICIES = {
  // 10 login attempts per 15 minutes per IP — blocks brute force.
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  // 5 registration attempts per hour per IP — blocks account spam.
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
};

/** Build a 429 Response with Retry-After header. */
export function rateLimitedResponse(resetAt: number): Response {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: `Too many attempts. Try again in ${retryAfter} seconds.`,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
      },
    },
  );
}
