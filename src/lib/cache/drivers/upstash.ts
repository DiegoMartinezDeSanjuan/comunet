/**
 * Upstash cache driver.
 *
 * HTTP/REST client — works in serverless and Edge environments.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { CacheContract, RateLimitResult, RateLimitStore, KeyValueStore } from '../types'

function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error(
      '[cache:upstash] CACHE_DRIVER is set to "upstash" but UPSTASH_REDIS_REST_URL ' +
      'and/or UPSTASH_REDIS_REST_TOKEN are not configured.',
    )
  }

  return new Redis({ url, token })
}

// ─── Rate Limit ───────────────────────────────────────────

/**
 * Upstash rate limiting uses their built-in sliding window algorithm.
 * We cache Ratelimit instances per (limit, windowMs) combo to reuse them.
 */
function createUpstashRateLimitStore(redis: Redis): RateLimitStore {
  const limiters = new Map<string, Ratelimit>()

  function getLimiter(limit: number, windowMs: number): Ratelimit {
    const cacheKey = `${limit}:${windowMs}`
    let limiter = limiters.get(cacheKey)
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        analytics: false,
      })
      limiters.set(cacheKey, limiter)
    }
    return limiter
  }

  return {
    async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
      const limiter = getLimiter(limit, windowMs)
      const { success, remaining, reset } = await limiter.limit(key)

      return {
        allowed: success,
        remaining,
        retryAfterMs: Math.max(0, reset - Date.now()),
      }
    },
  }
}

// ─── Key-Value Store ──────────────────────────────────────

function createUpstashKVStore(redis: Redis): KeyValueStore {
  return {
    async get<T>(key: string): Promise<T | null> {
      const value = await redis.get<T>(key)
      return value ?? null
    },

    async set<T>(key: string, value: T, ttlSec: number): Promise<void> {
      await redis.set(key, JSON.stringify(value), { ex: ttlSec })
    },

    async del(key: string): Promise<void> {
      await redis.del(key)
    },
  }
}

// ─── Driver Factory ───────────────────────────────────────

export function createUpstashDriver(): CacheContract {
  const redis = getRedisClient()

  return {
    rateLimit: createUpstashRateLimitStore(redis),
    kv: createUpstashKVStore(redis),
    driver: 'upstash',
  }
}
