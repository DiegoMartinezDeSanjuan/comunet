import { describe, it, expect } from 'vitest'
import {
  canReadReports,
  canManageOfficeSettings,
  canReadUsers,
  canManageUsers,
  canReadAudit,
  requirePermission
} from '@/lib/permissions'
import { UserRole } from '@prisma/client'

describe('Permissions Engine', () => {
  const createUserSession = (role: UserRole) => ({
    userId: '1',
    officeId: 'office-1',
    role,
    name: 'Test',
    email: 'test@example.com',
    linkedOwnerId: null,
    linkedProviderId: null,
  })

  it('SUPERADMIN has all settings permissions', () => {
    const session = createUserSession('SUPERADMIN')
    expect(canReadReports(session)).toBe(true)
    expect(canManageOfficeSettings(session)).toBe(true)
    expect(canReadUsers(session)).toBe(true)
    expect(canManageUsers(session)).toBe(true)
    expect(canReadAudit(session)).toBe(true)
  })

  it('OFFICE_ADMIN has full backoffice settings permissions', () => {
    const session = createUserSession('OFFICE_ADMIN')
    expect(canReadReports(session)).toBe(true)
    expect(canReadUsers(session)).toBe(true)
    expect(canReadAudit(session)).toBe(true)
    expect(canManageOfficeSettings(session)).toBe(true)
    expect(canManageUsers(session)).toBe(true)
  })

  it('PRESIDENT (portal role) cannot access backoffice settings', () => {
    const session = createUserSession('PRESIDENT')
    expect(canReadReports(session)).toBe(false)
    expect(canReadUsers(session)).toBe(false)
    expect(canManageUsers(session)).toBe(false)
    expect(canReadAudit(session)).toBe(false)
  })

  it('PROVIDER (external role) cannot access backoffice settings', () => {
    const session = createUserSession('PROVIDER')
    expect(canReadReports(session)).toBe(false)
    expect(canReadUsers(session)).toBe(false)
    expect(canManageUsers(session)).toBe(false)
    expect(canReadAudit(session)).toBe(false)
  })
})
