import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRepository } = vi.hoisted(() => ({
  mockRepository: {
    createNotificationRecord: vi.fn(),
    listActiveUsersByRoles: vi.fn(),
    listLinkedUsersForProvider: vi.fn(),
  },
}))

vi.mock('@/modules/notifications/server/repository', () => mockRepository)

vi.mock('@/lib/auth', () => ({
  isBackofficeRole: (role: string) => [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
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
      { id: 'manager-1', name: 'Manager', email: 'manager@example.com', role: 'MANAGER' },
      { id: 'super-1', name: 'Super', email: 'super@example.com', role: 'SUPERADMIN' },
    ])

    mockRepository.createNotificationRecord.mockResolvedValue({ id: 'notification-x' })

    await notifyIncidentCreated({
      officeId: 'office-1',
      communityId: 'community-1',
      actorUserId: 'actor-1',
      incidentId: 'incident-1',
      incidentTitle: 'Fuga en portal',
    })

    expect(mockRepository.createNotificationRecord).toHaveBeenCalledTimes(2)
    expect(mockRepository.createNotificationRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'manager-1',
        title: 'Nueva incidencia creada',
      }),
    )
  })

  it('includes linked provider users when an incident is assigned', async () => {
    mockRepository.listActiveUsersByRoles.mockResolvedValueOnce([
      { id: 'actor-1', name: 'Actor', email: 'actor@example.com', role: 'OFFICE_ADMIN' },
      { id: 'manager-1', name: 'Manager', email: 'manager@example.com', role: 'MANAGER' },
    ])
    mockRepository.listLinkedUsersForProvider.mockResolvedValueOnce([
      { id: 'provider-user-1', name: 'Proveedor', email: 'proveedor@example.com', role: 'PROVIDER' },
    ])
    mockRepository.createNotificationRecord.mockResolvedValue({ id: 'notification-x' })

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

    expect(mockRepository.createNotificationRecord).toHaveBeenCalledTimes(2)
    expect(mockRepository.createNotificationRecord).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: 'provider-user-1' }),
    )
  })

  it('notifies creators and internal users when an incident is resolved', async () => {
    mockRepository.listActiveUsersByRoles.mockResolvedValueOnce([
      { id: 'actor-1', name: 'Actor', email: 'actor@example.com', role: 'OFFICE_ADMIN' },
      { id: 'manager-1', name: 'Manager', email: 'manager@example.com', role: 'MANAGER' },
    ])
    mockRepository.createNotificationRecord.mockResolvedValue({ id: 'notification-x' })

    await notifyIncidentResolved({
      officeId: 'office-1',
      communityId: 'community-1',
      actorUserId: 'actor-1',
      incidentId: 'incident-3',
      incidentTitle: 'Ascensor bloqueado',
      createdByUserId: 'creator-2',
    })

    expect(mockRepository.createNotificationRecord).toHaveBeenCalledTimes(2)
    expect(mockRepository.createNotificationRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'creator-2',
        title: 'Incidencia resuelta',
      }),
    )
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
