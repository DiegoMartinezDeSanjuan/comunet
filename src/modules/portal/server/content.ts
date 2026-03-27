import 'server-only'

import type { Session } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { getPortalAccessScope, isPortalOwnerPresidentRole } from './policy'
import { getUniqueValues } from './utils'

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
