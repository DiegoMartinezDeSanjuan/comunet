import { describe, it, expect, vi, beforeEach } from 'vitest'

// We will mock the database and auth session
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    userId: 'admin-1',
    officeId: 'office-1',
    role: 'SUPERADMIN',
  }),
  hashPassword: vi.fn((pwd: string) => Promise.resolve(`hashed_${pwd}`)),
}))

vi.mock('@/lib/permissions', () => ({
  canManageUsers: vi.fn().mockReturnValue(true),
}))

vi.mock('@/modules/audit/server/services', () => ({
  logAudit: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

import { createUser, resetUserPassword } from '@/modules/users/server/actions'

describe('Users Actions Server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createUser throws if email already exists', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'exists' })

    await expect(createUser({
      name: 'Test Nuevo',
      email: 'test@example.com',
      role: 'VIEWER',
      status: 'ACTIVE',
    })).rejects.toThrow('El email ya está en uso en el sistema')
  })

  it('createUser happily creates a user and returns a temp password', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce(null)
    mockPrisma.user.create.mockResolvedValueOnce({
      id: 'new-user',
      role: 'MANAGER',
    })

    const result = await createUser({
      name: 'Gestor Test',
      email: 'gestor@example.com',
      role: 'MANAGER',
      status: 'ACTIVE',
    })

    expect(result.temporaryPassword).toBeDefined()
    expect(result.temporaryPassword.length).toBe(8)
    expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'gestor@example.com',
        role: 'MANAGER',
      })
    }))
  })

  it('resetUserPassword generates a new random password and updates user', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'user-to-reset' })
    mockPrisma.user.update.mockResolvedValueOnce({ id: 'user-to-reset' })

    const result = await resetUserPassword('user-to-reset')
    expect(result.temporaryPassword).toBeDefined()
    expect(result.temporaryPassword.length).toBe(8)
    expect(mockPrisma.user.update).toHaveBeenCalled()
  })
})
