/**
 * Tests for the cacheKey namespace function.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { cacheKey } from '@/lib/cache/config'

describe('cacheKey — namespace', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv
  })

  it('prefixes with comunet:{env}:v1:', () => {
    process.env.NODE_ENV = 'production'
    expect(cacheKey('rl:login:1.2.3.4')).toBe('comunet:production:v1:rl:login:1.2.3.4')
  })

  it('uses development as default env', () => {
    process.env.NODE_ENV = 'development'
    expect(cacheKey('jwt:bl:abc-123')).toBe('comunet:development:v1:jwt:bl:abc-123')
  })

  it('handles test environment', () => {
    process.env.NODE_ENV = 'test'
    expect(cacheKey('rl:api:10.0.0.1')).toBe('comunet:test:v1:rl:api:10.0.0.1')
  })

  it('separates environments — same raw key, different namespace', () => {
    const raw = 'rl:login:1.2.3.4'

    process.env.NODE_ENV = 'production'
    const prodKey = cacheKey(raw)

    process.env.NODE_ENV = 'development'
    const devKey = cacheKey(raw)

    expect(prodKey).not.toBe(devKey)
    expect(prodKey).toContain('production')
    expect(devKey).toContain('development')
  })
})
