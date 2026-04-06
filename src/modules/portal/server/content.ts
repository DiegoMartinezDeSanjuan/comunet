import 'server-only'

import type { Session } from '@/lib/auth/types'
import { prisma } from '@/lib/db'

import { getPortalAccessScope, isPortalOwnerPresidentRole } from './policy'
import { getUniqueValues } from './utils'

import { requireAuth } from '@/lib/auth'

export async function getPortalMeetingsPageQuery(limit = 12) {
  const session = await requireAuth()
  const meetings = await listPortalMeetings(session, limit)
  return { meetings, session }
}

export async function listPortalMeetings(session: Session, limit = 12) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return []
  }

  const scope = await getPortalAccessScope(session)
  const communityIds = getUniqueValues([
    ...scope.ownedCommunityIds,
    ...scope.presidentCommunityIds,
  ])

  if (!communityIds.length) {
    return []
  }

  return prisma.meeting.findMany({
    where: {
      communityId: { in: communityIds },
      status: { not: 'DRAFT' },
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      minutes: {
        select: {
          id: true,
          status: true,
          approvedAt: true,
        },
      },
    },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })
}

export async function getPortalDocumentsPageQuery(limit = 12) {
  const session = await requireAuth()
  const documents = await listPortalDocuments(session, limit)
  return { documents, session }
}

export async function listPortalDocuments(session: Session, limit = 12) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return []
  }

  const scope = await getPortalAccessScope(session)
  const communityIds = getUniqueValues([
    ...scope.ownedCommunityIds,
    ...scope.presidentCommunityIds,
  ])

  if (!communityIds.length) {
    return []
  }

  return prisma.document.findMany({
    where: {
      communityId: { in: communityIds },
      archivedAt: null,
      visibility: { in: ['OWNERS', 'PUBLIC'] },
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: limit,
  })
}

export async function getPortalCommunitySummaryPageQuery() {
  const session = await requireAuth()
  const summary = await getPortalCommunitySummary(session)
  return { summary, session }
}

export async function getPortalCommunitySummary(session: Session) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return null
  }

  const scope = await getPortalAccessScope(session)
  const communityIds = getUniqueValues([
    ...scope.ownedCommunityIds,
    ...scope.presidentCommunityIds,
  ])

  if (!communityIds.length) {
    return null
  }

  const communities = await prisma.community.findMany({
    where: { id: { in: communityIds } },
    include: {
      units: {
        where: {
          ownerships: { some: { ownerId: session.linkedOwnerId, endDate: null } },
        },
      },
      boardPositions: {
        where: { ownerId: session.linkedOwnerId },
      },
      office: {
        select: {
          name: true,
          phone: true,
          email: true,
        }
      }
    },
    orderBy: { name: 'asc' },
  })

  // Quick stats
  const receiptsCount = await prisma.receipt.count({
    where: {
      ownerId: session.linkedOwnerId,
      status: { in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'] },
    },
  })

  const incidentsCount = await prisma.incident.count({
    where: {
      createdByUserId: session.userId,
      status: { not: 'CLOSED' },
    },
  })

  return {
    communities,
    stats: {
      pendingReceipts: receiptsCount,
      activeIncidents: incidentsCount,
    },
  }
}
