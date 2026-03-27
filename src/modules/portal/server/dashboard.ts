import 'server-only'

import type { Session } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { listPortalDocuments, listPortalMeetings } from './content'
import { getPortalAccessScope, isPortalOwnerPresidentRole } from './policy'
import { getUniqueValues, toNumber } from './utils'

function attachReceiptNumbers<T extends { amount: unknown; paidAmount: unknown }>(receipt: T) {
  const amountValue = toNumber(receipt.amount)
  const paidAmountValue = toNumber(receipt.paidAmount)

  return {
    ...receipt,
    amountValue,
    paidAmountValue,
    pendingBalance: Math.max(0, amountValue - paidAmountValue),
  }
}

export async function getPortalDashboardData(session: Session) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return {
      scope: null,
      kpis: null,
      latestReceipts: [],
      ownedActiveIncidents: [],
      ownedCommunitySummaries: [],
      presidentCommunitySummaries: [],
      upcomingMeetings: [],
    }
  }

  const now = new Date()
  const scope = await getPortalAccessScope(session, now)
  const allCommunityIds = getUniqueValues([
    ...scope.ownedCommunityIds,
    ...scope.presidentCommunityIds,
  ])

  if (!allCommunityIds.length) {
    return {
      scope,
      kpis: {
        ownedCommunitiesCount: 0,
        ownedUnitsCount: 0,
        ownerPendingDebtTotal: 0,
        ownerActiveIncidentCount: 0,
        presidentCommunitiesCount: 0,
        presidentOpenIncidentCount: 0,
        presidentPendingDebtTotal: 0,
      },
      latestReceipts: [],
      ownedActiveIncidents: [],
      ownedCommunitySummaries: [],
      presidentCommunitySummaries: [],
      upcomingMeetings: [],
    }
  }

  const [ownerDebts, latestReceipts, ownedActiveIncidents, meetings, documents, presidentOpenIncidents, presidentDebts] =
    await Promise.all([
      scope.ownedCommunityIds.length > 0
        ? prisma.debt.findMany({
            where: {
              ownerId: session.linkedOwnerId,
              communityId: { in: scope.ownedCommunityIds },
              status: { in: ['PENDING', 'PARTIALLY_PAID'] },
            },
            select: {
              communityId: true,
              principal: true,
              surcharge: true,
            },
          })
        : Promise.resolve<Array<{ communityId: string; principal: unknown; surcharge: unknown }>>([]),
      scope.ownedCommunityIds.length > 0
        ? prisma.receipt.findMany({
            where: {
              ownerId: session.linkedOwnerId,
              communityId: { in: scope.ownedCommunityIds },
            },
            include: {
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  reference: true,
                },
              },
            },
            orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
            take: 6,
          })
        : Promise.resolve([]),
      scope.ownedUnitIds.length > 0
        ? prisma.incident.findMany({
            where: {
              unitId: { in: scope.ownedUnitIds },
              status: { notIn: ['RESOLVED', 'CLOSED'] },
              community: { officeId: session.officeId },
            },
            include: {
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  reference: true,
                },
              },
              assignedProvider: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
            take: 8,
          })
        : Promise.resolve([]),
      listPortalMeetings(session, 12),
      listPortalDocuments(session, 50),
      session.role === 'PRESIDENT' && scope.presidentCommunityIds.length > 0
        ? prisma.incident.findMany({
            where: {
              communityId: { in: scope.presidentCommunityIds },
              status: { notIn: ['RESOLVED', 'CLOSED'] },
            },
            select: {
              communityId: true,
              priority: true,
            },
          })
        : Promise.resolve([]),
      session.role === 'PRESIDENT' && scope.presidentCommunityIds.length > 0
        ? prisma.debt.findMany({
            where: {
              communityId: { in: scope.presidentCommunityIds },
              status: { in: ['PENDING', 'PARTIALLY_PAID'] },
            },
            select: {
              communityId: true,
              principal: true,
              surcharge: true,
            },
          })
        : Promise.resolve([]),
    ])

  const nextMeetingByCommunity = new Map<string, Date>()

  for (const meeting of meetings) {
    if (meeting.scheduledAt < now) {
      continue
    }

    const current = nextMeetingByCommunity.get(meeting.communityId)

    if (!current || meeting.scheduledAt < current) {
      nextMeetingByCommunity.set(meeting.communityId, meeting.scheduledAt)
    }
  }

  const ownerDebtByCommunity = new Map<string, number>()

  for (const debt of ownerDebts) {
    const current = ownerDebtByCommunity.get(debt.communityId) ?? 0
    ownerDebtByCommunity.set(
      debt.communityId,
      current + toNumber(debt.principal) + toNumber(debt.surcharge),
    )
  }

  const ownedIncidentCountByCommunity = new Map<string, number>()

  for (const incident of ownedActiveIncidents) {
    const current = ownedIncidentCountByCommunity.get(incident.communityId) ?? 0
    ownedIncidentCountByCommunity.set(incident.communityId, current + 1)
  }

  const ownedCommunitySummaries = scope.ownedCommunities.map((community) => ({
    id: community.id,
    name: community.name,
    ownedUnitCount: scope.ownedUnits.filter((unit) => unit.communityId === community.id).length,
    pendingDebtTotal: ownerDebtByCommunity.get(community.id) ?? 0,
    activeIncidentCount: ownedIncidentCountByCommunity.get(community.id) ?? 0,
    nextMeetingAt: nextMeetingByCommunity.get(community.id) ?? null,
  }))

  const documentCountByCommunity = new Map<string, number>()

  for (const document of documents) {
    const current = documentCountByCommunity.get(document.communityId) ?? 0
    documentCountByCommunity.set(document.communityId, current + 1)
  }

  const presidentOpenCountByCommunity = new Map<string, number>()
  const presidentUrgentCountByCommunity = new Map<string, number>()

  for (const incident of presidentOpenIncidents) {
    presidentOpenCountByCommunity.set(
      incident.communityId,
      (presidentOpenCountByCommunity.get(incident.communityId) ?? 0) + 1,
    )

    if (incident.priority === 'URGENT') {
      presidentUrgentCountByCommunity.set(
        incident.communityId,
        (presidentUrgentCountByCommunity.get(incident.communityId) ?? 0) + 1,
      )
    }
  }

  const presidentDebtByCommunity = new Map<string, number>()

  for (const debt of presidentDebts) {
    const current = presidentDebtByCommunity.get(debt.communityId) ?? 0
    presidentDebtByCommunity.set(
      debt.communityId,
      current + toNumber(debt.principal) + toNumber(debt.surcharge),
    )
  }

  const presidentCommunitySummaries = scope.presidentCommunities.map((community) => ({
    id: community.id,
    name: community.name,
    openIncidentCount: presidentOpenCountByCommunity.get(community.id) ?? 0,
    urgentIncidentCount: presidentUrgentCountByCommunity.get(community.id) ?? 0,
    pendingDebtTotal: presidentDebtByCommunity.get(community.id) ?? 0,
    nextMeetingAt: nextMeetingByCommunity.get(community.id) ?? null,
    visibleDocumentCount: documentCountByCommunity.get(community.id) ?? 0,
  }))

  return {
    scope,
    kpis: {
      ownedCommunitiesCount: scope.ownedCommunityIds.length,
      ownedUnitsCount: scope.ownedUnitIds.length,
      ownerPendingDebtTotal: ownerDebts.reduce(
        (sum, debt) => sum + toNumber(debt.principal) + toNumber(debt.surcharge),
        0,
      ),
      ownerActiveIncidentCount: ownedActiveIncidents.length,
      presidentCommunitiesCount: scope.presidentCommunityIds.length,
      presidentOpenIncidentCount: presidentOpenIncidents.length,
      presidentPendingDebtTotal: presidentDebts.reduce(
        (sum, debt) => sum + toNumber(debt.principal) + toNumber(debt.surcharge),
        0,
      ),
    },
    latestReceipts: latestReceipts.map((receipt) => attachReceiptNumbers(receipt)),
    ownedActiveIncidents,
    ownedCommunitySummaries,
    presidentCommunitySummaries,
    upcomingMeetings: meetings
      .filter((meeting) => meeting.scheduledAt >= now)
      .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime())
      .slice(0, 4),
  }
}
