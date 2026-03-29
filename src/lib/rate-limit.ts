/**
 * Distributed sliding-window rate limiter via Upstash Redis.
 * Falls back to an in-memory Map if Redis is not configured.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

interface RateLimiter {
  check(key: string): Promise<RateLimitResult>
  reset(): void
}

const isProd = process.env.NODE_ENV === 'production'
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

if (isProd && (!redisUrl || !redisToken)) {
  throw new Error('FATAL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured in production for distributed rate limiting.')
}

const redis = (redisUrl && redisToken)
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

function createMemoryRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, maxRequests } = options
  const store = new Map<string, { timestamps: number[] }>()

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
    async check(key: string): Promise<RateLimitResult> {
      const now = Date.now()
      let entry = store.get(key)

      if (!entry) {
        entry = { timestamps: [] }
        store.set(key, entry)
      }

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
    reset() {
      store.clear()
    },
  }
}

function createRedisRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, maxRequests } = options

  // Provide a reliable Ratelimit sliding window algorithm
  const upstashLimiter = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
    analytics: true,
  })

  return {
    async check(key: string): Promise<RateLimitResult> {
      if (!redis) throw new Error('Redis not initialized')
      
      const { success, limit, remaining, reset } = await upstashLimiter.limit(key)

      return {
        allowed: success,
        remaining,
        retryAfterMs: Math.max(0, reset - Date.now()),
      }
    },
    reset() {
      // noop for redis wildcard clear in this case
    },
  }
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return redis ? createRedisRateLimiter(options) : createMemoryRateLimiter(options)
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
