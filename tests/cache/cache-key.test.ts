/**
 * Tests for the cacheKey namespace function.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { cacheKey } from '@/lib/cache/config'

// We need to mutate process.env.NODE_ENV for testing
const env = process.env as Record<string, string | undefined>

describe('cacheKey — namespace', () => {
  const originalEnv = env.NODE_ENV

  afterEach(() => {
    env.NODE_ENV = originalEnv
  })

  it('prefixes with comunet:{env}:v1:', () => {
    env.NODE_ENV = 'production'
    expect(cacheKey('rl:login:1.2.3.4')).toBe('comunet:production:v1:rl:login:1.2.3.4')
  })

  it('uses development as default env', () => {
    env.NODE_ENV = 'development'
    expect(cacheKey('jwt:bl:abc-123')).toBe('comunet:development:v1:jwt:bl:abc-123')
  })

  it('handles test environment', () => {
    env.NODE_ENV = 'test'
    expect(cacheKey('rl:api:10.0.0.1')).toBe('comunet:test:v1:rl:api:10.0.0.1')
  })

  it('separates environments — same raw key, different namespace', () => {
    const raw = 'rl:login:1.2.3.4'

    env.NODE_ENV = 'production'
    const prodKey = cacheKey(raw)

    env.NODE_ENV = 'development'
    const devKey = cacheKey(raw)

    expect(prodKey).not.toBe(devKey)
    expect(prodKey).toContain('production')
    expect(devKey).toContain('development')
  })
})
