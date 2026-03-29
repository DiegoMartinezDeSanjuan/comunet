/**
 * Distributed sliding-window rate limiter via Upstash Redis.
 * Falls back to an in-memory Map if Redis is not configured.
 */

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

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
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

  return {
    async check(key: string): Promise<RateLimitResult> {
      if (!redis) throw new Error('Redis not initialized')
      const now = Date.now()
      const clearBefore = now - windowMs

      const redisKey = `ratelimit:${key}`
      const pipeline = redis.pipeline()

      // 1. Remove timestamps outside the window
      pipeline.zremrangebyscore(redisKey, 0, clearBefore)
      
      // 2. Count timestamps in the window
      pipeline.zcount(redisKey, clearBefore, '+inf')

      // 3. Get the oldest timestamp in the window (for retry logic)
      pipeline.zrange(redisKey, 0, 0, { withScores: true })

      const [remResult, countResult, oldestResult] = await pipeline.exec()
      
      const currentCount = Number(countResult)
      
      if (currentCount >= maxRequests) {
        const oldestTimestamp = Array.isArray(oldestResult) && oldestResult.length > 1 
           ? Number(oldestResult[1]) 
           : now
        const retryAfterMs = Math.max(0, oldestTimestamp + windowMs - now)
        
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs,
        }
      }

      // 4. Add the new timestamp if allowed
      const addPipeline = redis.pipeline()
      addPipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` })
      addPipeline.pexpire(redisKey, windowMs)
      await addPipeline.exec()

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - (currentCount + 1)),
        retryAfterMs: 0,
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
