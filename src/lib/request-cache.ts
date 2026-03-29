import 'server-only'
import { cache } from 'react'

/**
 * Wraps a function with React's cache() to memoize its results for the duration
 * of a single request. 
 * This is useful for deduplicating repeated database queries across components
 * and server actions within the same request lifecycle.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRequestCache<T extends (...args: any[]) => any>(fn: T): T {
  return cache(fn)
}
