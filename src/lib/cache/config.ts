/**
 * Cache factory — singleton that creates the appropriate driver
 * based on the CACHE_DRIVER environment variable.
 *
 * Usage:
 *   import { getCache } from '@/lib/cache/config'
 *   const cache = getCache()
 *   await cache.kv.set('key', value, 300)
 *   await cache.rateLimit.consume('rl:api:1.2.3.4', 100, 60_000)
 */

import type { CacheContract, CacheDriver } from './types'

let _instance: CacheContract | null = null

export function getCache(): CacheContract {
  if (_instance) return _instance

  const driver = (process.env.CACHE_DRIVER || 'memory') as CacheDriver

  switch (driver) {
    case 'upstash': {
      // Dynamic import to avoid loading @upstash/* when not needed
      const { createUpstashDriver } = require('./drivers/upstash')
      _instance = createUpstashDriver()
      break
    }
    case 'redis': {
      const { createRedisDriver } = require('./drivers/redis')
      _instance = createRedisDriver()
      break
    }
    case 'memory':
    default: {
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
