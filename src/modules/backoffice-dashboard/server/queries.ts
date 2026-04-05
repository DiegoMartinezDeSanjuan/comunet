import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { computeOfficeFinanceKPIs } from '@/modules/finances/server/kpi-service'
import { getIncidentDashboardSnapshotQuery } from '@/modules/incidents/server/queries'

/* ─── Private helpers ────────────────────────────────────────── */

async function getGeneralStats(officeId: string) {
    const [communitiesCount, ownersCount, pendingReceipts, upcomingMeetings] =
        await Promise.all([
            prisma.community.count({
                where: { officeId, archivedAt: null },
            }),
            prisma.owner.count({
                where: { officeId, archivedAt: null },
            }),
            prisma.receipt.count({
                where: {
                    community: { officeId },
                    status: { in: ['ISSUED', 'OVERDUE'] },
                },
            }),
            prisma.meeting.count({
                where: {
                    community: { officeId },
                    scheduledAt: { gte: new Date() },
                    status: { in: ['DRAFT', 'SCHEDULED'] },
                },
            }),
        ])

    return { communitiesCount, ownersCount, pendingReceipts, upcomingMeetings }
}

async function getReceiptStatusBreakdown(officeId: string) {
    const receipts = await prisma.receipt.groupBy({
        by: ['status'],
        where: { community: { officeId } },
        _count: { id: true },
    })
    return receipts.map((r) => ({ status: r.status, count: r._count.id }))
}

/* ─── Public queries ─────────────────────────────────────────── */

/**
 * Aggregator query for the backoffice dashboard page.
 *
 * Resolves auth + permissions internally and returns everything
 * the page needs in a single call.
 */
export async function getDashboardDataQuery() {
    const session = await requireAuth()

    if (!requirePermission(session, 'dashboard.read')) {
        throw new Error('FORBIDDEN')
    }

    const [financeKPIs, generalStats, receiptBreakdown, incidentSnapshot] =
        await Promise.all([
            computeOfficeFinanceKPIs(session.officeId),
            getGeneralStats(session.officeId),
            getReceiptStatusBreakdown(session.officeId),
            getIncidentDashboardSnapshotQuery(),
        ])

    return {
        financeKPIs,
        generalStats,
        receiptBreakdown,
        incidentSnapshot,
    }
}
