/**
 * In-memory sliding-window rate limiter.
 *
 * Good enough for a single-instance deployment (which covers 500 users).
 * For multi-instance (horizontal scaling), replace the Map with Redis
 * using the same interface.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 })
 *   const result = limiter.check('user-ip')
 *   if (!result.allowed) return 429
 */

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Max requests allowed within the window */
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

interface RateLimitEntry {
  timestamps: number[]
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests } = options
  const store = new Map<string, RateLimitEntry>()

  // Cleanup stale entries every 60 seconds to prevent memory leak
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, 60_000)

  // Prevent the interval from keeping the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()
      let entry = store.get(key)

      if (!entry) {
        entry = { timestamps: [] }
        store.set(key, entry)
      }

      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

      if (entry.timestamps.length >= maxRequests) {
        const oldestInWindow = entry.timestamps[0]
        const retryAfterMs = oldestInWindow + windowMs - now

        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, retryAfterMs),
        }
      }

      entry.timestamps.push(now)

      return {
        allowed: true,
        remaining: maxRequests - entry.timestamps.length,
        retryAfterMs: 0,
      }
    },

    /** For testing */
    reset() {
      store.clear()
    },
  }
}

// ─── Pre-configured limiters ────────────────────────────

/** Login: 5 attempts per minute per IP */
export const loginLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 5,
})

/** API general: 100 requests per minute per IP */
export const apiLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
})

/** Export endpoints: 5 per minute per user (heavy operations) */
export const exportLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 5,
})
