import { describe, expect, it } from 'vitest'

import {
  canAssignProviderByRole,
  canManageIncidentByRole,
  canManageProviderByRole,
  canReadIncidentByRole,
  canReadProviderByRole,
  canTransitionIncidentStatus,
  deriveIncidentResolvedAt,
  deriveIncidentStatusAfterProviderAssignment,
  isClosedIncidentStatus,
  mapCommentVisibilityFromDb,
  mapCommentVisibilityToDb,
} from '@/modules/incidents/policy'

describe('incidents slice 2.3 - policy', () => {
  it('applies the backoffice permission policy for incidents and providers', () => {
    expect(canReadIncidentByRole('ACCOUNTANT')).toBe(true)
    expect(canReadIncidentByRole('VIEWER')).toBe(true)
    expect(canManageIncidentByRole('MANAGER')).toBe(true)
    expect(canManageIncidentByRole('ACCOUNTANT')).toBe(false)
    expect(canAssignProviderByRole('MANAGER')).toBe(true)
    expect(canAssignProviderByRole('VIEWER')).toBe(false)
    expect(canReadProviderByRole('VIEWER')).toBe(true)
    expect(canManageProviderByRole('MANAGER')).toBe(true)
    expect(canManageProviderByRole('ACCOUNTANT')).toBe(false)
  })

  it('accepts only the incident status transitions defined by the domain service', () => {
    expect(canTransitionIncidentStatus('OPEN', 'ASSIGNED')).toBe(true)
    expect(canTransitionIncidentStatus('ASSIGNED', 'IN_PROGRESS')).toBe(true)
    expect(canTransitionIncidentStatus('WAITING_VENDOR', 'RESOLVED')).toBe(true)
    expect(canTransitionIncidentStatus('RESOLVED', 'CLOSED')).toBe(true)
    expect(canTransitionIncidentStatus('OPEN', 'CLOSED')).toBe(false)
    expect(canTransitionIncidentStatus('CLOSED', 'IN_PROGRESS')).toBe(false)
  })

  it('derives consistent state for provider assignment and resolution dates', () => {
    expect(deriveIncidentStatusAfterProviderAssignment('OPEN')).toBe('ASSIGNED')
    expect(deriveIncidentStatusAfterProviderAssignment('IN_PROGRESS')).toBe('IN_PROGRESS')

    const fixedNow = new Date('2026-03-24T10:00:00.000Z')
    const resolvedAt = deriveIncidentResolvedAt(null, 'RESOLVED', fixedNow)

    expect(resolvedAt?.toISOString()).toBe('2026-03-24T10:00:00.000Z')
    expect(isClosedIncidentStatus('CLOSED')).toBe(true)
    expect(isClosedIncidentStatus('OPEN')).toBe(false)
  })

  it('maps SHARED visibility directly and still tolerates legacy PUBLIC rows', () => {
    expect(mapCommentVisibilityToDb('SHARED')).toBe('SHARED')
    expect(mapCommentVisibilityToDb('INTERNAL')).toBe('INTERNAL')
    expect(mapCommentVisibilityFromDb('SHARED')).toBe('SHARED')
    expect(mapCommentVisibilityFromDb('INTERNAL')).toBe('INTERNAL')
    expect(mapCommentVisibilityFromDb('PUBLIC')).toBe('SHARED')
  })
})
