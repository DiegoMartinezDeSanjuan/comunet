/**
 * Pre-configured rate limiters for COMUNET.
 *
 * These are drop-in replacements for the old `src/lib/rate-limit.ts`.
 * Import from '@/lib/cache/rate-limit' instead.
 *
 * Key convention (after namespace):
 *   comunet:{env}:v1:rl:login:{ip}       → Login attempts
 *   comunet:{env}:v1:rl:api:{ip}         → General API requests
 *   comunet:{env}:v1:rl:export:{userId}  → Heavy export operations
 */

import { getCache, cacheKey } from './config'
import type { RateLimitResult } from './types'

interface RateLimiter {
  check(key: string): Promise<RateLimitResult>
}

function createLimiter(prefix: string, limit: number, windowMs: number): RateLimiter {
  return {
    async check(key: string): Promise<RateLimitResult> {
      return getCache().rateLimit.consume(cacheKey(`${prefix}:${key}`), limit, windowMs)
    },
  }
}

/** Login: 5 attempts per minute per IP */
export const loginLimiter = createLimiter('rl:login', 5, 60_000)

/** API general: 100 requests per minute per IP */
export const apiLimiter = createLimiter('rl:api', 100, 60_000)

/** Export endpoints: 5 per minute per user (heavy operations) */
export const exportLimiter = createLimiter('rl:export', 5, 60_000)

/** MFA Verification: 20 attempts per 5 minutes per IP/User */
export const mfaVerifyLimiter = createLimiter('rl:mfa_verify', 20, 5 * 60_000)

/** MFA Setup: 20 attempts per 5 minutes per IP/User */
export const mfaSetupLimiter = createLimiter('rl:mfa_setup', 20, 5 * 60_000)
