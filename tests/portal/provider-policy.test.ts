import { describe, it, expect } from 'vitest'
import {
  getProviderAllowedTransitions,
  canProviderTransitionStatus,
} from '@/modules/portal/server/provider'

describe('Provider Status Transitions', () => {
  describe('getProviderAllowedTransitions', () => {
    it('allows ASSIGNED → IN_PROGRESS', () => {
      const allowed = getProviderAllowedTransitions('ASSIGNED')
      expect(allowed).toContain('IN_PROGRESS')
    })

    it('allows IN_PROGRESS → WAITING_VENDOR, RESOLVED', () => {
      const allowed = getProviderAllowedTransitions('IN_PROGRESS')
      expect(allowed).toContain('WAITING_VENDOR')
      expect(allowed).toContain('RESOLVED')
    })

    it('allows WAITING_VENDOR → IN_PROGRESS, RESOLVED', () => {
      const allowed = getProviderAllowedTransitions('WAITING_VENDOR')
      expect(allowed).toContain('IN_PROGRESS')
      expect(allowed).toContain('RESOLVED')
    })

    it('returns empty array for OPEN (provider cannot transition from OPEN)', () => {
      const allowed = getProviderAllowedTransitions('OPEN')
      expect(allowed).toEqual([])
    })

    it('returns empty array for RESOLVED (terminal for provider)', () => {
      const allowed = getProviderAllowedTransitions('RESOLVED')
      expect(allowed).toEqual([])
    })

    it('returns empty array for CLOSED (fully terminal)', () => {
      const allowed = getProviderAllowedTransitions('CLOSED')
      expect(allowed).toEqual([])
    })
  })

  describe('canProviderTransitionStatus', () => {
    it('allows ASSIGNED → IN_PROGRESS', () => {
      expect(canProviderTransitionStatus('ASSIGNED', 'IN_PROGRESS')).toBe(true)
    })

    it('allows IN_PROGRESS → RESOLVED', () => {
      expect(canProviderTransitionStatus('IN_PROGRESS', 'RESOLVED')).toBe(true)
    })

    it('allows IN_PROGRESS → WAITING_VENDOR', () => {
      expect(canProviderTransitionStatus('IN_PROGRESS', 'WAITING_VENDOR')).toBe(true)
    })

    it('allows WAITING_VENDOR → IN_PROGRESS', () => {
      expect(canProviderTransitionStatus('WAITING_VENDOR', 'IN_PROGRESS')).toBe(true)
    })

    it('allows WAITING_VENDOR → RESOLVED', () => {
      expect(canProviderTransitionStatus('WAITING_VENDOR', 'RESOLVED')).toBe(true)
    })

    it('rejects OPEN → anything (provider cannot touch OPEN)', () => {
      expect(canProviderTransitionStatus('OPEN', 'ASSIGNED')).toBe(false)
      expect(canProviderTransitionStatus('OPEN', 'IN_PROGRESS')).toBe(false)
    })

    it('rejects any → CLOSED (provider cannot close)', () => {
      expect(canProviderTransitionStatus('IN_PROGRESS', 'CLOSED')).toBe(false)
      expect(canProviderTransitionStatus('RESOLVED', 'CLOSED')).toBe(false)
    })

    it('rejects same status (noop)', () => {
      expect(canProviderTransitionStatus('IN_PROGRESS', 'IN_PROGRESS')).toBe(false)
    })

    it('rejects ASSIGNED → RESOLVED (must go through IN_PROGRESS first)', () => {
      expect(canProviderTransitionStatus('ASSIGNED', 'RESOLVED')).toBe(false)
    })

    it('rejects ASSIGNED → WAITING_VENDOR directly', () => {
      expect(canProviderTransitionStatus('ASSIGNED', 'WAITING_VENDOR')).toBe(false)
    })
  })
})
