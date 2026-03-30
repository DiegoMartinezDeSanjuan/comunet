/**
 * Pre-configured rate limiters for COMUNET.
 *
 * These are drop-in replacements for the old `src/lib/rate-limit.ts`.
 * Import from '@/lib/cache/rate-limit' instead.
 *
 * Key convention:
 *   rl:login:{ip}       → Login attempts
 *   rl:api:{ip}         → General API requests
 *   rl:export:{userId}  → Heavy export operations
 */

import { getCache } from './config'
import type { RateLimitResult } from './types'

interface RateLimiter {
  check(key: string): Promise<RateLimitResult>
}

function createLimiter(prefix: string, limit: number, windowMs: number): RateLimiter {
  return {
    async check(key: string): Promise<RateLimitResult> {
      return getCache().rateLimit.consume(`${prefix}:${key}`, limit, windowMs)
    },
  }
}

/** Login: 5 attempts per minute per IP */
export const loginLimiter = createLimiter('rl:login', 5, 60_000)

/** API general: 100 requests per minute per IP */
export const apiLimiter = createLimiter('rl:api', 100, 60_000)

/** Export endpoints: 5 per minute per user (heavy operations) */
export const exportLimiter = createLimiter('rl:export', 5, 60_000)
