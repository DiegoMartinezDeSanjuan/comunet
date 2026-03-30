/**
 * In-memory cache driver.
 *
 * ⚠  DEV / TEST ONLY — NOT for production.
 *
 * This driver stores all data in process memory. A restart will
 * erase the JWT blocklist, allowing revoked tokens to pass.
 *
 * For production use CACHE_DRIVER=redis with a Valkey/Redis container.
 */

import type { CacheContract, RateLimitResult, RateLimitStore, KeyValueStore } from '../types'

// ─── Rate Limit (Sliding Window) ──────────────────────────

function createMemoryRateLimitStore(): RateLimitStore {
  const store = new Map<string, number[]>()

  // Cleanup stale entries every 60s to prevent memory leak
  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of store) {
      const filtered = timestamps.filter((t) => now - t < 120_000)
      if (filtered.length === 0) store.delete(key)
      else store.set(key, filtered)
    }
  }, 60_000)

  if (cleanup.unref) cleanup.unref()

  return {
    async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
      const now = Date.now()
      let timestamps = store.get(key) ?? []

      // Remove expired entries
      timestamps = timestamps.filter((t) => now - t < windowMs)

      if (timestamps.length >= limit) {
        const oldest = timestamps[0]
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, oldest + windowMs - now),
        }
      }

      timestamps.push(now)
      store.set(key, timestamps)

      return {
        allowed: true,
        remaining: limit - timestamps.length,
        retryAfterMs: 0,
      }
    },
  }
}

// ─── Key-Value Store ──────────────────────────────────────

interface KVEntry {
  value: unknown
  expiresAt: number
}

function createMemoryKVStore(): KeyValueStore {
  const store = new Map<string, KVEntry>()

  // Cleanup expired entries every 30s
  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key)
    }
  }, 30_000)

  if (cleanup.unref) cleanup.unref()

  return {
    async get<T>(key: string): Promise<T | null> {
      const entry = store.get(key)
      if (!entry) return null
      if (entry.expiresAt <= Date.now()) {
        store.delete(key)
        return null
      }
      return entry.value as T
    },

    async set<T>(key: string, value: T, ttlSec: number): Promise<void> {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlSec * 1000,
      })
    },

    async del(key: string): Promise<void> {
      store.delete(key)
    },
  }
}

// ─── Driver Factory ───────────────────────────────────────

export function createMemoryDriver(): CacheContract {
  return {
    rateLimit: createMemoryRateLimitStore(),
    kv: createMemoryKVStore(),
    driver: 'memory',
  }
}
