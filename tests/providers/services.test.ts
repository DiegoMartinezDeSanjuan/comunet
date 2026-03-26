import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAudit, mockPrisma, mockRepository } = vi.hoisted(() => ({
  mockPrisma: {
    provider: { findFirst: vi.fn() },
  },
  mockRepository: {
    createProviderRecord: vi.fn(),
    findProviderByIdForOffice: vi.fn(),
    updateProviderRecord: vi.fn(),
  },
  mockAudit: {
    logAudit: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))
vi.mock('@/modules/providers/server/repository', () => mockRepository)
vi.mock('@/modules/audit/server/services', () => mockAudit)

import {
  assertProviderAvailableInOffice,
  createProvider,
  updateProvider,
} from '@/modules/providers/server/services'

describe('providers slice 2.3 - services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates providers through the domain service and audits the write', async () => {
    mockRepository.createProviderRecord.mockResolvedValueOnce({
      id: 'provider-1',
      name: 'Electricidad Centro',
      category: 'Electricidad',
    })

    const created = await createProvider('office-1', 'user-1', {
      name: 'Electricidad Centro',
      category: 'Electricidad',
      email: 'operaciones@electricidadcentro.es',
    })

    expect(created.id).toBe('provider-1')
    expect(mockRepository.createProviderRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        officeId: 'office-1',
        name: 'Electricidad Centro',
        category: 'Electricidad',
      }),
    )
    expect(mockAudit.logAudit).toHaveBeenCalledTimes(1)
  })

  it('rejects provider updates outside the office scope', async () => {
    mockRepository.findProviderByIdForOffice.mockResolvedValueOnce(null)

    await expect(
      updateProvider('office-1', 'user-1', 'provider-404', {
        name: 'Proveedor inexistente',
      }),
    ).rejects.toThrow('Proveedor no encontrado')
  })

  it('archives providers logically when requested', async () => {
    mockRepository.findProviderByIdForOffice.mockResolvedValueOnce({
      provider: {
        id: 'provider-2',
        name: 'Ascensores Hispania',
        category: 'Ascensores',
        archivedAt: null,
      },
      activeIncidents: [],
      closedIncidents: [],
      activeCount: 0,
      closedCount: 0,
      lastActivityAt: null,
    })

    mockRepository.updateProviderRecord.mockResolvedValueOnce({
      id: 'provider-2',
      name: 'Ascensores Hispania',
      category: 'Ascensores',
      archivedAt: new Date('2026-03-26T09:00:00.000Z'),
    })

    const updated = await updateProvider('office-1', 'user-1', 'provider-2', {
      name: 'Ascensores Hispania',
      archived: true,
    })

    expect(updated.archivedAt).toBeInstanceOf(Date)
    expect(mockRepository.updateProviderRecord).toHaveBeenCalledWith(
      'provider-2',
      expect.objectContaining({
        name: 'Ascensores Hispania',
        archivedAt: expect.any(Date),
      }),
    )
  })

  it('checks office scope and archived state before returning an assignable provider', async () => {
    mockPrisma.provider.findFirst.mockResolvedValueOnce(null)

    await expect(
      assertProviderAvailableInOffice('office-1', 'provider-outside'),
    ).rejects.toThrow('Proveedor fuera de alcance')
  })
})
