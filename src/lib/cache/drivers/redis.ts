/**
 * Redis TCP cache driver (ioredis).
 *
 * For self-hosted Redis or Valkey on a NAS, local Docker, etc.
 * Requires REDIS_URL (e.g. redis://redis:6379).
 */

import Redis from 'ioredis'
import type { CacheContract, RateLimitResult, RateLimitStore, KeyValueStore } from '../types'

function getRedisClient(): Redis {
  const url = process.env.REDIS_URL

  if (!url) {
    throw new Error(
      '[cache:redis] CACHE_DRIVER is set to "redis" but REDIS_URL is not configured. ' +
      'Expected format: redis://host:port',
    )
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Exponential backoff: 50ms, 100ms, 200ms, then stop
      if (times > 3) return null
      return Math.min(times * 50, 200)
    },
    lazyConnect: true,
  })

  client.on('error', (err) => {
    console.error('[cache:redis] Connection error:', err.message)
  })

  client.on('connect', () => {
    console.log('[cache:redis] Connected to Redis')
  })

  // Trigger the connection
  client.connect().catch(() => {
    // Error is handled by the 'error' event
  })

  return client
}

// ─── Rate Limit (Sliding Window via INCR + PEXPIRE) ──────

function createRedisRateLimitStore(redis: Redis): RateLimitStore {
  return {
    async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
      // Use a simple fixed-window counter with INCR + PEXPIRE.
      // This is slightly less precise than a true sliding window but
      // is atomic, fast, and sufficient for rate limiting.
      const pipeline = redis.pipeline()
      pipeline.incr(key)
      pipeline.pttl(key)

      const results = await pipeline.exec()
      if (!results) {
        // Pipeline failed — allow the request (fail open)
        return { allowed: true, remaining: limit - 1, retryAfterMs: 0 }
      }

      const count = (results[0]?.[1] as number) ?? 1
      const ttl = (results[1]?.[1] as number) ?? -1

      // If TTL is -1 (no expiry), this is the first request — set expiry
      if (ttl === -1 || ttl === -2) {
        await redis.pexpire(key, windowMs)
      }

      if (count > limit) {
        const retryAfterMs = ttl > 0 ? ttl : windowMs
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs,
        }
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        retryAfterMs: 0,
      }
    },
  }
}

// ─── Key-Value Store ──────────────────────────────────────

function createRedisKVStore(redis: Redis): KeyValueStore {
  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = await redis.get(key)
      if (raw === null) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return raw as unknown as T
      }
    },

    async set<T>(key: string, value: T, ttlSec: number): Promise<void> {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSec)
    },

    async del(key: string): Promise<void> {
      await redis.del(key)
    },
  }
}

// ─── Driver Factory ───────────────────────────────────────

export function createRedisDriver(): CacheContract {
  const redis = getRedisClient()

  return {
    rateLimit: createRedisRateLimitStore(redis),
    kv: createRedisKVStore(redis),
    driver: 'redis',
  }
}
