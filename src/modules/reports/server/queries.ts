import 'server-only'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { canReadReports } from '@/lib/permissions'

/**
 * Reports page auth aggregator — resolves auth + canReadReports.
 * Returns session.officeId for streaming sub-sections to use.
 */
export async function getReportsPageQuery() {
  const session = await requireAuth()
  if (!canReadReports(session)) {
    throw new Error('FORBIDDEN')
  }
  return { session }
}

export async function getReportsDashboard(officeId: string) {
  const [communitiesCount, incidentsCount, pendingDebtResult] = await Promise.all([
    prisma.community.count({
      where: { officeId, archivedAt: null },
    }),
    prisma.incident.count({
      where: { community: { officeId }, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_VENDOR'] } },
    }),
    prisma.debt.aggregate({
      where: { community: { officeId }, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      _sum: {
        principal: true,
        surcharge: true,
      },
    }),
  ])

  return {
    communitiesCount,
    openIncidents: incidentsCount,
    totalPendingDebt: Number(pendingDebtResult._sum?.principal || 0) + Number(pendingDebtResult._sum?.surcharge || 0),
  }
}

export async function getDebtByCommunityReport(officeId: string) {
  const communities = await prisma.community.findMany({
    where: { officeId, archivedAt: null },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          debts: {
            where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
          },
        },
      },
    },
  })

  // Group by aggregation
  const debtsByCommunity = await prisma.debt.groupBy({
    by: ['communityId'],
    where: {
      community: { officeId },
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
    },
    _sum: {
      principal: true,
      surcharge: true,
    },
  })

  const results = communities.map((comm) => {
    const debtGroup = debtsByCommunity.find((d) => d.communityId === comm.id)
    return {
      communityId: comm.id,
      communityName: comm.name,
      debtorsCount: comm._count.debts, // approx, using debt entries count
      totalDebt: Number(debtGroup?._sum?.principal || 0) + Number(debtGroup?._sum?.surcharge || 0),
    }
  })

  // Sort by highest debt
  return results.sort((a, b) => b.totalDebt - a.totalDebt)
}

export async function getReceiptsStatusReport(officeId: string) {
  const totals = await prisma.receipt.groupBy({
    by: ['status'],
    where: { community: { officeId } },
    _sum: { amount: true },
    _count: { id: true },
  })

  return totals.map((t) => ({
    status: t.status,
    count: t._count.id,
    amount: Number(t._sum.amount || 0),
  }))
}

export async function getIncidentsSummaryReport(officeId: string) {
  const byStatus = await prisma.incident.groupBy({
    by: ['status'],
    where: { community: { officeId } },
    _count: { id: true },
  })

  const byPriority = await prisma.incident.groupBy({
    by: ['priority'],
    where: { community: { officeId }, status: { notIn: ['RESOLVED', 'CLOSED'] } },
    _count: { id: true },
  })
  
  // also get recent incidents
  const recent = await prisma.incident.findMany({
    where: { community: { officeId }, status: { notIn: ['RESOLVED', 'CLOSED'] } },
    include: {
      community: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return {
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    activeByPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
    recentActive: recent.map(r => ({
      id: r.id,
      title: r.title,
      communityName: r.community.name,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt,
    })),
  }
}

export async function getProviderPerformanceSummary(officeId: string) {
  // Simple summary of active incidents by provider
  const providers = await prisma.provider.findMany({
    where: { officeId, archivedAt: null },
    select: {
      id: true,
      name: true,
      category: true,
      _count: {
        select: {
          incidents: {
            where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
          },
        },
      },
    },
    orderBy: {
      incidents: {
        _count: 'desc',
      },
    },
    take: 10, // top 10 busiest providers
  })

  return providers.map((p) => ({
    providerId: p.id,
    name: p.name,
    category: p.category,
    activeIncidents: p._count.incidents,
  }))
}

export async function getUpcomingMeetingsReport(officeId: string) {
  const meetings = await prisma.meeting.findMany({
    where: { 
      community: { officeId }, 
      status: { in: ['DRAFT', 'SCHEDULED'] } 
    },
    include: {
      community: { select: { name: true } },
      _count: { select: { agendaItems: true } }
    },
    orderBy: { scheduledAt: 'asc' },
    take: 10,
  })

  return meetings.map((m) => ({
    id: m.id,
    title: m.title,
    communityName: m.community.name,
    scheduledAt: m.scheduledAt,
    status: m.status,
    agendaCount: m._count.agendaItems,
  }))
}
