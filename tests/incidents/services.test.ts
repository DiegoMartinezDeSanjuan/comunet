import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = {
  community: { findFirst: vi.fn() },
  unit: { findFirst: vi.fn() },
  provider: { findFirst: vi.fn() },
}

const mockRepository = {
  createIncidentCommentRecord: vi.fn(),
  createIncidentRecord: vi.fn(),
  findIncidentByIdForOffice: vi.fn(),
  listIncidentTimelineRecords: vi.fn(),
  updateIncidentRecord: vi.fn(),
}

const mockAudit = {
  logAudit: vi.fn(),
}

const mockNotifications = {
  notifyIncidentAssigned: vi.fn(),
  notifyIncidentCreated: vi.fn(),
  notifyIncidentResolved: vi.fn(),
  notifySharedIncidentComment: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/modules/incidents/server/repository', () => mockRepository)
vi.mock('@/modules/audit/server/services', () => mockAudit)
vi.mock('@/modules/notifications/server/services', () => mockNotifications)

import {
  addIncidentComment,
  assignProviderToIncident,
  changeIncidentStatus,
  createIncident,
} from '@/modules/incidents/server/services'

describe('incidents slice 2.3 - services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('rejects incident creation when the community is outside the office scope', async () => {
    mockPrisma.community.findFirst.mockResolvedValueOnce(null)

    await expect(
      createIncident('office-1', 'user-1', {
        communityId: 'community-outside',
        title: 'Fuga en patio interior',
        priority: 'HIGH',
      }),
    ).rejects.toThrow('Comunidad fuera de alcance')
  })

  it('rejects assigning an archived provider', async () => {
    mockRepository.findIncidentByIdForOffice.mockResolvedValueOnce({
      id: 'incident-1',
      communityId: 'community-1',
      title: 'Humedad en garaje',
      assignedProviderId: null,
      status: 'OPEN',
      resolvedAt: null,
      createdBy: { id: 'creator-1' },
    })

    mockPrisma.provider.findFirst.mockResolvedValueOnce({
      id: 'provider-1',
      officeId: 'office-1',
      name: 'Proveedor archivado',
      archivedAt: new Date('2026-03-26T10:00:00Z'),
    })

    await expect(
      assignProviderToIncident('office-1', 'user-1', {
        incidentId: 'incident-1',
        providerId: 'provider-1',
      }),
    ).rejects.toThrow('No se puede asignar un proveedor archivado')
  })

  it('supports provider reassignment and keeps an audited trace', async () => {
    mockRepository.findIncidentByIdForOffice.mockResolvedValueOnce({
      id: 'incident-2',
      communityId: 'community-1',
      title: 'Avería de fontanería',
      assignedProviderId: 'provider-old',
      status: 'ASSIGNED',
      resolvedAt: null,
      createdBy: { id: 'creator-1' },
    })

    mockPrisma.provider.findFirst.mockResolvedValueOnce({
      id: 'provider-new',
      officeId: 'office-1',
      name: 'Fontanería nueva',
      archivedAt: null,
    })

    mockRepository.updateIncidentRecord.mockResolvedValueOnce({
      id: 'incident-2',
      communityId: 'community-1',
      title: 'Avería de fontanería',
      assignedProviderId: 'provider-new',
      status: 'ASSIGNED',
      resolvedAt: null,
      createdBy: { id: 'creator-1' },
    })

    const updated = await assignProviderToIncident('office-1', 'user-2', {
      incidentId: 'incident-2',
      providerId: 'provider-new',
    })

    expect(updated.assignedProviderId).toBe('provider-new')
    expect(mockRepository.updateIncidentRecord).toHaveBeenCalledWith('incident-2', {
      assignedProviderId: 'provider-new',
      status: 'ASSIGNED',
      resolvedAt: null,
    })
    expect(mockAudit.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'incident-2',
        meta: expect.objectContaining({
          type: 'PROVIDER_ASSIGNMENT',
          previousProviderId: 'provider-old',
          nextProviderId: 'provider-new',
        }),
      }),
    )
    expect(mockNotifications.notifyIncidentAssigned).toHaveBeenCalledTimes(1)
  })

  it('synchronizes resolvedAt when moving an incident to RESOLVED', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-26T12:00:00.000Z'))

    mockRepository.findIncidentByIdForOffice.mockResolvedValueOnce({
      id: 'incident-3',
      communityId: 'community-1',
      title: 'Luz fundida',
      assignedProviderId: 'provider-1',
      status: 'IN_PROGRESS',
      resolvedAt: null,
      createdBy: { id: 'creator-2' },
    })

    mockRepository.updateIncidentRecord.mockResolvedValueOnce({
      id: 'incident-3',
      communityId: 'community-1',
      title: 'Luz fundida',
      assignedProviderId: 'provider-1',
      status: 'RESOLVED',
      resolvedAt: new Date('2026-03-26T12:00:00.000Z'),
      createdBy: { id: 'creator-2' },
    })

    await changeIncidentStatus('office-1', 'user-2', {
      incidentId: 'incident-3',
      status: 'RESOLVED',
    })

    expect(mockRepository.updateIncidentRecord).toHaveBeenCalledWith(
      'incident-3',
      expect.objectContaining({
        status: 'RESOLVED',
        resolvedAt: new Date('2026-03-26T12:00:00.000Z'),
      }),
    )
    expect(mockNotifications.notifyIncidentResolved).toHaveBeenCalledTimes(1)
  })

  it('blocks arbitrary changes on a closed incident', async () => {
    mockRepository.findIncidentByIdForOffice.mockResolvedValueOnce({
      id: 'incident-4',
      communityId: 'community-1',
      title: 'Incidencia cerrada',
      assignedProviderId: 'provider-2',
      status: 'CLOSED',
      resolvedAt: new Date('2026-03-20T10:00:00.000Z'),
      createdBy: { id: 'creator-3' },
    })

    await expect(
      changeIncidentStatus('office-1', 'user-3', {
        incidentId: 'incident-4',
        status: 'IN_PROGRESS',
      }),
    ).rejects.toThrow('Transición no permitida: CLOSED -> IN_PROGRESS')
  })

  it('stores SHARED comments and triggers shared-comment notifications', async () => {
    mockRepository.findIncidentByIdForOffice.mockResolvedValueOnce({
      id: 'incident-5',
      communityId: 'community-1',
      title: 'Comentario compartido',
      assignedProviderId: 'provider-10',
      status: 'WAITING_VENDOR',
      resolvedAt: null,
      createdBy: { id: 'creator-10' },
    })

    mockRepository.createIncidentCommentRecord.mockResolvedValueOnce({
      id: 'comment-1',
      incidentId: 'incident-5',
      authorUserId: 'user-10',
      body: 'Proveedor y presidencia informados.',
      visibility: 'SHARED',
      createdAt: new Date('2026-03-26T13:00:00.000Z'),
      author: {
        id: 'user-10',
        name: 'Admin',
        email: 'admin@example.com',
      },
    })

    const created = await addIncidentComment('office-1', 'user-10', {
      incidentId: 'incident-5',
      body: 'Proveedor y presidencia informados.',
      visibility: 'SHARED',
    })

    expect(mockRepository.createIncidentCommentRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        incidentId: 'incident-5',
        visibility: 'SHARED',
      }),
    )
    expect(created.visibility).toBe('SHARED')
    expect(mockNotifications.notifySharedIncidentComment).toHaveBeenCalledTimes(1)
  })
})
