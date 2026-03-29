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

  it('MANAGER can read reports, users, and audit but not manage settings', () => {
    const session = createUserSession('MANAGER')
    expect(canReadReports(session)).toBe(true)
    expect(canReadUsers(session)).toBe(true)
    expect(canReadAudit(session)).toBe(true)
    
    expect(canManageOfficeSettings(session)).toBe(false)
    expect(canManageUsers(session)).toBe(false)
  })

  it('ACCOUNTANT can read reports and audit but not settings or users', () => {
    const session = createUserSession('ACCOUNTANT')
    expect(canReadReports(session)).toBe(true)
    expect(canReadAudit(session)).toBe(true)
    
    expect(canReadUsers(session)).toBe(false)
    expect(requirePermission(session, 'settings.read')).toBe(false)
  })

  it('VIEWER cannot access operational tools in settings', () => {
    const session = createUserSession('VIEWER')
    expect(canReadReports(session)).toBe(false)
    expect(canReadUsers(session)).toBe(false)
    expect(canManageUsers(session)).toBe(false)
    expect(canReadAudit(session)).toBe(false)
  })
})
