/**
 * Cache Contract Tests
 *
 * The same test suite runs against every driver (memory, upstash, redis).
 * This guarantees they all behave identically — TTL, rate limit, KV, blocklist.
 *
 * Driver selection:
 *   - memory:  always runs (no external deps)
 *   - redis:   runs when REDIS_URL is set (e.g. local Valkey container)
 *   - upstash: runs when UPSTASH_REDIS_REST_URL + TOKEN are set
 *
 * Run:
 *   pnpm test tests/cache            # memory only (CI-safe)
 *   REDIS_URL=redis://localhost:6379 pnpm test tests/cache   # memory + redis
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { CacheContract } from '@/lib/cache/types'
import { createMemoryDriver } from '@/lib/cache/drivers/memory'

// ─── Helpers ──────────────────────────────────────────────

/**
 * Build the list of drivers to test.
 * Memory always runs; redis/upstash only if env vars are set.
 */
function getTestDrivers(): Array<{ name: string; factory: () => CacheContract }> {
  const drivers: Array<{ name: string; factory: () => CacheContract }> = [
    {
      name: 'memory',
      factory: () => createMemoryDriver(),
    },
  ]

  // Redis — only if we can connect
  if (process.env.TEST_REDIS_URL || process.env.REDIS_URL) {
    drivers.push({
      name: 'redis',
      factory: () => {
        // Set REDIS_URL for the driver factory
        process.env.REDIS_URL = process.env.TEST_REDIS_URL || process.env.REDIS_URL
        const { createRedisDriver } = require('@/lib/cache/drivers/redis')
        return createRedisDriver()
      },
    })
  }

  // Upstash — only if credentials are present
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    drivers.push({
      name: 'upstash',
      factory: () => {
        const { createUpstashDriver } = require('@/lib/cache/drivers/upstash')
        return createUpstashDriver()
      },
    })
  }

  return drivers
}

// ─── Contract Test Suite ──────────────────────────────────

const drivers = getTestDrivers()

describe.each(drivers)('CacheContract — $name driver', ({ factory }) => {
  let cache: CacheContract

  beforeEach(() => {
    cache = factory()
  })

  // ─── KV Store ─────────────────────────────────────────

  describe('KeyValueStore', () => {
    const testKey = `test:contract:kv:${Date.now()}`

    afterEach(async () => {
      // Cleanup
      try { await cache.kv.del(testKey) } catch { /* noop */ }
    })

    it('returns null for non-existent key', async () => {
      const result = await cache.kv.get('test:contract:nonexistent:' + Date.now())
      expect(result).toBeNull()
    })

    it('stores and retrieves a string value', async () => {
      await cache.kv.set(testKey, 'hello', 60)
      const result = await cache.kv.get<string>(testKey)
      expect(result).toBe('hello')
    })

    it('stores and retrieves a boolean value', async () => {
      await cache.kv.set(testKey, true, 60)
      const result = await cache.kv.get<boolean>(testKey)
      expect(result).toBe(true)
    })

    it('stores and retrieves an object value', async () => {
      const obj = { userId: 'abc', role: 'ADMIN', count: 42 }
      await cache.kv.set(testKey, obj, 60)
      const result = await cache.kv.get<typeof obj>(testKey)
      expect(result).toEqual(obj)
    })

    it('deletes a key', async () => {
      await cache.kv.set(testKey, 'to-delete', 60)
      await cache.kv.del(testKey)
      const result = await cache.kv.get(testKey)
      expect(result).toBeNull()
    })

    it('respects TTL — expired keys return null', async () => {
      await cache.kv.set(testKey, 'ephemeral', 1) // 1 second TTL

      // Immediately should exist
      const before = await cache.kv.get<string>(testKey)
      expect(before).toBe('ephemeral')

      // Wait for expiry
      await new Promise((r) => setTimeout(r, 1500))

      const after = await cache.kv.get<string>(testKey)
      expect(after).toBeNull()
    }, 5000)

    it('overwrites existing values', async () => {
      await cache.kv.set(testKey, 'v1', 60)
      await cache.kv.set(testKey, 'v2', 60)
      const result = await cache.kv.get<string>(testKey)
      expect(result).toBe('v2')
    })
  })

  // ─── Rate Limit Store ─────────────────────────────────

  describe('RateLimitStore', () => {
    // Use unique keys per test run to avoid collisions
    const baseKey = `test:contract:rl:${Date.now()}`

    it('allows requests within the limit', async () => {
      const key = `${baseKey}:within`
      const result = await cache.rateLimit.consume(key, 5, 60_000)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
      expect(result.remaining).toBeLessThanOrEqual(4)
      expect(result.retryAfterMs).toBe(0)
    })

    it('blocks requests exceeding the limit', async () => {
      const key = `${baseKey}:exceed`

      // Consume all 3 allowed
      for (let i = 0; i < 3; i++) {
        const res = await cache.rateLimit.consume(key, 3, 60_000)
        expect(res.allowed).toBe(true)
      }

      // 4th should be blocked
      const blocked = await cache.rateLimit.consume(key, 3, 60_000)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.retryAfterMs).toBeGreaterThan(0)
    })

    it('resets after the window expires', async () => {
      const key = `${baseKey}:reset`

      // Fill up with limit=2, window=1s
      await cache.rateLimit.consume(key, 2, 1000)
      await cache.rateLimit.consume(key, 2, 1000)

      const blocked = await cache.rateLimit.consume(key, 2, 1000)
      expect(blocked.allowed).toBe(false)

      // Wait for window to expire
      await new Promise((r) => setTimeout(r, 1500))

      const afterReset = await cache.rateLimit.consume(key, 2, 1000)
      expect(afterReset.allowed).toBe(true)
    }, 5000)
  })

  // ─── JWT Blocklist Pattern ────────────────────────────

  describe('JWT Blocklist (KV pattern)', () => {
    it('simulates revoke → check → allow flow', async () => {
      const jti = `test:jti:${Date.now()}`
      const blocklistKey = `jwt:bl:${jti}`

      // 1. Token should NOT be revoked initially
      const before = await cache.kv.get<boolean>(blocklistKey)
      expect(before).toBeNull()

      // 2. Revoke the token (simulate logout)
      await cache.kv.set(blocklistKey, true, 60)

      // 3. Token should now be revoked
      const after = await cache.kv.get<boolean>(blocklistKey)
      expect(after).toBe(true)

      // Cleanup
      await cache.kv.del(blocklistKey)
    })

    it('revoked token expires after TTL', async () => {
      const jti = `test:jti:ttl:${Date.now()}`
      const blocklistKey = `jwt:bl:${jti}`

      await cache.kv.set(blocklistKey, true, 1) // 1 second

      const revoked = await cache.kv.get<boolean>(blocklistKey)
      expect(revoked).toBe(true)

      await new Promise((r) => setTimeout(r, 1500))

      const expired = await cache.kv.get<boolean>(blocklistKey)
      expect(expired).toBeNull()
    }, 5000)
  })

  // ─── Driver Identity ──────────────────────────────────

  describe('Driver metadata', () => {
    it('exposes the correct driver name', () => {
      expect(['memory', 'upstash', 'redis']).toContain(cache.driver)
    })

    it('has rateLimit store', () => {
      expect(cache.rateLimit).toBeDefined()
      expect(typeof cache.rateLimit.consume).toBe('function')
    })

    it('has kv store', () => {
      expect(cache.kv).toBeDefined()
      expect(typeof cache.kv.get).toBe('function')
      expect(typeof cache.kv.set).toBe('function')
      expect(typeof cache.kv.del).toBe('function')
    })
  })
})
