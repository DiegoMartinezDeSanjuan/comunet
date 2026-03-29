import 'server-only'
import { cache } from 'react'

/**
 * Wraps a function with React's cache() to memoize its results for the duration
 * of a single request. 
 * This is useful for deduplicating repeated database queries across components
 * and server actions within the same request lifecycle.
 *
 * Note: The `any` types are intentional here — this is a generic wrapper
 * that must accept arbitrary function signatures. TypeScript's `unknown`
 * is too restrictive for React's `cache()` which expects assignable types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRequestCache<T extends (...args: any[]) => any>(fn: T): T {
  return cache(fn)
}
