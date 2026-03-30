/**
 * Cache Contract — Abstract interfaces for the cache layer.
 *
 * The app talks to these interfaces, never to Upstash/Redis directly.
 * Drivers (memory, upstash, redis) implement them behind the scenes.
 */

export type CacheDriver = 'memory' | 'upstash' | 'redis'

// ─── Rate Limiting ────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

export interface RateLimitStore {
  /**
   * Consume one token from the rate limit bucket for the given key.
   * @param key      Unique identifier (e.g. "rl:login:192.168.1.1")
   * @param limit    Max requests allowed within the window
   * @param windowMs Time window in milliseconds
   */
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>
}

// ─── Key-Value Store ──────────────────────────────────────

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSec: number): Promise<void>
  del(key: string): Promise<void>
}

// ─── Unified Contract ─────────────────────────────────────

export interface CacheContract {
  rateLimit: RateLimitStore
  kv: KeyValueStore
  driver: CacheDriver
}
