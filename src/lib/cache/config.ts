/**
 * Cache factory — singleton that creates the appropriate driver
 * based on the CACHE_DRIVER environment variable.
 *
 * Key namespace: all keys are prefixed with `comunet:{env}:v1:` to avoid
 * collisions if Redis is shared with staging, queues, or other services.
 *
 * Usage:
 *   import { getCache, cacheKey } from '@/lib/cache/config'
 *   const cache = getCache()
 *   await cache.kv.set(cacheKey('session:abc'), value, 300)
 */

import type { CacheContract, CacheDriver } from './types'

const VALID_DRIVERS: CacheDriver[] = ['memory', 'upstash', 'redis']

let _instance: CacheContract | null = null

/**
 * Build a namespaced cache key.
 *
 * Format: comunet:{NODE_ENV}:v1:{rawKey}
 *
 * Examples:
 *   cacheKey('rl:login:1.2.3.4')  → 'comunet:production:v1:rl:login:1.2.3.4'
 *   cacheKey('jwt:bl:uuid-123')   → 'comunet:production:v1:jwt:bl:uuid-123'
 */
export function cacheKey(rawKey: string): string {
  const env = process.env.NODE_ENV || 'development'
  return `comunet:${env}:v1:${rawKey}`
}

export function getCache(): CacheContract {
  if (_instance) return _instance

  const raw = process.env.CACHE_DRIVER || 'memory'
  const isProd = process.env.NODE_ENV === 'production'

  // ─── Strict validation ──────────────────────────────────
  if (!VALID_DRIVERS.includes(raw as CacheDriver)) {
    const msg =
      `[cache] Invalid CACHE_DRIVER="${raw}". ` +
      `Valid options: ${VALID_DRIVERS.join(', ')}.`

    if (isProd) {
      throw new Error(
        `FATAL: ${msg} Refusing to start in production with an unknown driver. ` +
        'This prevents silently falling back to in-memory cache.',
      )
    }

    console.warn(`${msg} Falling back to "memory" for development.`)
  }

  const driver = VALID_DRIVERS.includes(raw as CacheDriver)
    ? (raw as CacheDriver)
    : 'memory'

  // ─── Production safety check ────────────────────────────
  if (isProd && driver === 'memory') {
    console.warn(
      '\n' +
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║  ⚠  CACHE_DRIVER=memory in PRODUCTION                      ║\n' +
      '║                                                             ║\n' +
      '║  JWT blocklist, rate limits and revocations are stored in   ║\n' +
      '║  process memory. A restart will ERASE all revoked tokens.   ║\n' +
      '║                                                             ║\n' +
      '║  Set CACHE_DRIVER=redis with REDIS_URL for production use.  ║\n' +
      '╚══════════════════════════════════════════════════════════════╝\n',
    )
  }

  switch (driver) {
    case 'upstash': {
      const { createUpstashDriver } = require('./drivers/upstash')
      _instance = createUpstashDriver()
      break
    }
    case 'redis': {
      const { createRedisDriver } = require('./drivers/redis')
      _instance = createRedisDriver()
      break
    }
    case 'memory': {
      const { createMemoryDriver } = require('./drivers/memory')
      _instance = createMemoryDriver()
      break
    }
  }

  console.log(`[cache] Initialized with driver: ${driver}`)
  return _instance!
}

/**
 * Reset the singleton — only useful for testing.
 */
export function resetCache(): void {
  _instance = null
}
