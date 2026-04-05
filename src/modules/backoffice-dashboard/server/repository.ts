import 'server-only'

import { prisma } from '@/lib/db'

/* ─── Dashboard-specific data access ────────────────────────── */

/**
 * General stats for the backoffice dashboard KPI cards.
 */
export async function getGeneralStats(officeId: string) {
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

/**
 * Receipt status breakdown for the dashboard chart.
 */
export async function getReceiptStatusBreakdown(officeId: string) {
    const receipts = await prisma.receipt.groupBy({
        by: ['status'],
        where: { community: { officeId } },
        _count: { id: true },
    })
    return receipts.map((r) => ({ status: r.status, count: r._count.id }))
}
