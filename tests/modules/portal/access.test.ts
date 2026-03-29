import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Session } from '@/lib/auth'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    ownership: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    boardPosition: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    receipt: {
      findFirst: vi.fn(),
    },
    incident: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

import {
  canReadPortalCommunitySummary,
  canReadPortalIncident,
  canReadPortalReceipt,
  isActivePresidentForCommunity,
} from '@/modules/portal/server/policy'
import { getPortalIncidentDetail } from '@/modules/portal/server/incidents'

const ownerSession: Session = {
  userId: 'user-owner',
  officeId: 'office-1',
  role: 'OWNER',
  name: 'Laura Gómez',
  email: 'propietario@comunet.test',
  linkedOwnerId: 'owner-1',
  linkedProviderId: null,
}

const presidentSession: Session = {
  userId: 'user-president',
  officeId: 'office-1',
  role: 'PRESIDENT',
  name: 'María Martínez',
  email: 'presidenta@comunet.test',
  linkedOwnerId: 'owner-2',
  linkedProviderId: null,
}

describe('portal slice 2.4 - access policy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('limits portal receipts to the linked owner scope', async () => {
    mockPrisma.receipt.findFirst.mockResolvedValueOnce({
      ownerId: 'owner-1',
      community: { officeId: 'office-1' },
    })

    await expect(canReadPortalReceipt(ownerSession, 'receipt-own')).resolves.toBe(true)

    mockPrisma.receipt.findFirst.mockResolvedValueOnce({
      ownerId: 'owner-99',
      community: { officeId: 'office-1' },
    })

    await expect(canReadPortalReceipt(ownerSession, 'receipt-foreign')).resolves.toBe(false)
  })

  it('restricts OWNER incident visibility to owned units and excludes community-level incidents', async () => {
    mockPrisma.incident.findFirst.mockResolvedValueOnce({
      communityId: 'community-1',
      unitId: 'unit-1',
      community: { officeId: 'office-1' },
    })
    mockPrisma.ownership.findFirst.mockResolvedValueOnce({ id: 'ownership-1' })

    await expect(canReadPortalIncident(ownerSession, 'incident-own-unit')).resolves.toBe(true)

    mockPrisma.incident.findFirst.mockResolvedValueOnce({
      communityId: 'community-1',
      unitId: null,
      community: { officeId: 'office-1' },
    })

    await expect(canReadPortalIncident(ownerSession, 'incident-community')).resolves.toBe(false)
  })

  it('allows PRESIDENT community summaries only when the board position is active', async () => {
    mockPrisma.ownership.findFirst.mockResolvedValueOnce(null)
    mockPrisma.boardPosition.findFirst.mockResolvedValueOnce({ id: 'board-1' })

    await expect(
      canReadPortalCommunitySummary(presidentSession, 'community-1', new Date('2026-03-26T10:00:00Z')),
    ).resolves.toBe(true)

    mockPrisma.ownership.findFirst.mockResolvedValueOnce(null)
    mockPrisma.boardPosition.findFirst.mockResolvedValueOnce(null)

    await expect(
      canReadPortalCommunitySummary(presidentSession, 'community-1', new Date('2026-03-26T10:00:00Z')),
    ).resolves.toBe(false)
  })

  it('excludes INTERNAL comments from portal incident detail and normalizes legacy PUBLIC to SHARED', async () => {
    mockPrisma.incident.findFirst.mockResolvedValueOnce({
      id: 'incident-1',
      communityId: 'community-1',
      unitId: 'unit-1',
      title: 'Puerta del trastero no cierra',
      description: 'Detalle visible de incidencia',
      priority: 'MEDIUM',
      status: 'OPEN',
      reportedAt: new Date('2026-03-22T19:10:00Z'),
      dueAt: new Date('2026-03-29T14:00:00Z'),
      resolvedAt: null,
      community: {
        id: 'community-1',
        name: 'Edificio Los Pinos',
        officeId: 'office-1',
      },
      unit: {
        id: 'unit-1',
        reference: '3A',
        floor: '3',
        door: 'A',
      },
      createdBy: {
        id: 'user-owner',
        name: 'Laura Gómez',
        email: 'propietario@comunet.test',
      },
      assignedProvider: null,
      comments: [
        {
          id: 'comment-1',
          incidentId: 'incident-1',
          authorUserId: 'user-admin',
          body: 'Comentario interno no visible',
          visibility: 'INTERNAL',
          createdAt: new Date('2026-03-23T09:00:00Z'),
          author: {
            id: 'user-admin',
            name: 'Admin',
            email: 'admin@example.com',
          },
        },
        {
          id: 'comment-2',
          incidentId: 'incident-1',
          authorUserId: 'user-manager',
          body: 'Comentario compartido visible',
          visibility: 'SHARED',
          createdAt: new Date('2026-03-23T10:15:00Z'),
          author: {
            id: 'user-manager',
            name: 'Manager',
            email: 'manager@example.com',
          },
        },
        {
          id: 'comment-3',
          incidentId: 'incident-1',
          authorUserId: 'user-legacy',
          body: 'Comentario público heredado',
          visibility: 'PUBLIC',
          createdAt: new Date('2026-03-23T11:00:00Z'),
          author: {
            id: 'user-legacy',
            name: 'Legacy',
            email: 'legacy@example.com',
          },
        },
      ],
    })
    mockPrisma.ownership.findFirst.mockResolvedValueOnce({ id: 'ownership-1' })

    const detail = await getPortalIncidentDetail(ownerSession, 'incident-1')

    expect(detail?.comments.map((comment) => comment.body)).toEqual([
      'Comentario compartido visible',
      'Comentario público heredado',
    ])
    expect(detail?.comments.every((comment) => comment.visibility === 'SHARED')).toBe(true)
  })

  it('validates the active president role per community', async () => {
    mockPrisma.boardPosition.findFirst.mockResolvedValueOnce({ id: 'board-1' })

    await expect(
      isActivePresidentForCommunity(presidentSession, 'community-1', new Date('2026-03-26T10:00:00Z')),
    ).resolves.toBe(true)

    mockPrisma.boardPosition.findFirst.mockResolvedValueOnce(null)

    await expect(
      isActivePresidentForCommunity(presidentSession, 'community-1', new Date('2026-03-26T10:00:00Z')),
    ).resolves.toBe(false)

    await expect(
      isActivePresidentForCommunity(ownerSession, 'community-1', new Date('2026-03-26T10:00:00Z')),
    ).resolves.toBe(false)
  })
})
