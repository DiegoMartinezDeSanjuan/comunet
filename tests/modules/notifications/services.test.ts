import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRepository } = vi.hoisted(() => ({
  mockRepository: {
    createNotificationRecord: vi.fn(),
    createManyNotificationRecords: vi.fn(),
    listActiveUsersByRoles: vi.fn(),
    listLinkedUsersForProvider: vi.fn(),
  },
}))

vi.mock('@/modules/notifications/server/repository', () => mockRepository)

vi.mock('@/lib/auth', () => ({
  isBackofficeRole: (role: string) => [
    'SUPERADMIN',
    'OFFICE_ADMIN',
  ].includes(role),
}))

import {
  createNotification,
  notifyIncidentAssigned,
  notifyIncidentCreated,
  notifyIncidentResolved,
  sendMockEmail,
} from '@/modules/notifications/server/services'

describe('notifications slice 2.3 - services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository.createManyNotificationRecords.mockResolvedValue({ count: 0 })
  })

  it('creates a basic in-app notification record', async () => {
    mockRepository.createNotificationRecord.mockResolvedValueOnce({
      id: 'notification-1',
      status: 'SENT',
    })

    await createNotification({
      officeId: 'office-1',
      recipientUserId: 'user-1',
      title: 'Nueva incidencia creada',
      body: 'Prueba',
    })

    expect(mockRepository.createNotificationRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        officeId: 'office-1',
        recipientUserId: 'user-1',
        channel: 'IN_APP',
        status: 'SENT',
      }),
    )
  })

  it('notifies internal recipients except the actor when an incident is created', async () => {
    mockRepository.listActiveUsersByRoles.mockResolvedValueOnce([
      { id: 'actor-1', name: 'Actor', email: 'actor@example.com', role: 'OFFICE_ADMIN' },
      { id: 'admin-2', name: 'Admin2', email: 'admin2@example.com', role: 'OFFICE_ADMIN' },
      { id: 'super-1', name: 'Super', email: 'super@example.com', role: 'SUPERADMIN' },
    ])

    await notifyIncidentCreated({
      officeId: 'office-1',
      communityId: 'community-1',
      actorUserId: 'actor-1',
      incidentId: 'incident-1',
      incidentTitle: 'Fuga en portal',
    })

    // Now uses batch insert: single createMany call with 2 recipients
    expect(mockRepository.createManyNotificationRecords).toHaveBeenCalledTimes(1)
    const batchArg = mockRepository.createManyNotificationRecords.mock.calls[0][0]
    expect(batchArg).toHaveLength(2)
    expect(batchArg.map((n: { recipientUserId: string }) => n.recipientUserId)).toContain('admin-2')
    expect(batchArg.map((n: { recipientUserId: string }) => n.recipientUserId)).toContain('super-1')
    expect(batchArg.map((n: { recipientUserId: string }) => n.recipientUserId)).not.toContain('actor-1')
  })

  it('includes linked provider users when an incident is assigned', async () => {
    mockRepository.listActiveUsersByRoles.mockResolvedValueOnce([
      { id: 'actor-1', name: 'Actor', email: 'actor@example.com', role: 'OFFICE_ADMIN' },
      { id: 'admin-2', name: 'Admin2', email: 'admin2@example.com', role: 'OFFICE_ADMIN' },
    ])
    mockRepository.listLinkedUsersForProvider.mockResolvedValueOnce([
      { id: 'provider-user-1', name: 'Proveedor', email: 'proveedor@example.com', role: 'PROVIDER' },
    ])

    await notifyIncidentAssigned({
      officeId: 'office-1',
      communityId: 'community-1',
      actorUserId: 'actor-1',
      incidentId: 'incident-2',
      incidentTitle: 'Humedad garaje',
      providerId: 'provider-1',
      providerName: 'Fontanería Rápida 24h',
      createdByUserId: 'creator-1',
    })

    expect(mockRepository.createManyNotificationRecords).toHaveBeenCalledTimes(1)
    const batchArg = mockRepository.createManyNotificationRecords.mock.calls[0][0]
    expect(batchArg).toHaveLength(2)
    expect(batchArg.map((n: { recipientUserId: string }) => n.recipientUserId)).toContain('provider-user-1')
  })

  it('notifies creators and internal users when an incident is resolved', async () => {
    mockRepository.listActiveUsersByRoles.mockResolvedValueOnce([
      { id: 'actor-1', name: 'Actor', email: 'actor@example.com', role: 'OFFICE_ADMIN' },
      { id: 'admin-2', name: 'Admin2', email: 'admin2@example.com', role: 'OFFICE_ADMIN' },
    ])

    await notifyIncidentResolved({
      officeId: 'office-1',
      communityId: 'community-1',
      actorUserId: 'actor-1',
      incidentId: 'incident-3',
      incidentTitle: 'Ascensor bloqueado',
      createdByUserId: 'creator-2',
    })

    expect(mockRepository.createManyNotificationRecords).toHaveBeenCalledTimes(1)
    const batchArg = mockRepository.createManyNotificationRecords.mock.calls[0][0]
    expect(batchArg).toHaveLength(2)
    expect(batchArg.map((n: { recipientUserId: string }) => n.recipientUserId)).toContain('creator-2')
    expect(batchArg[0].title).toBe('Incidencia resuelta')
  })

  it('exposes a mock email adapter result without SMTP dependency', async () => {
    const result = await sendMockEmail({
      to: 'test@example.com',
      subject: 'Prueba',
      body: 'Contenido',
    })

    expect(result.success).toBe(true)
    expect(result.id).toContain('mock-')
  })
})
