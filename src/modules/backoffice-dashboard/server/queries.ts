import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { computeOfficeFinanceKPIs } from '@/modules/finances/server/kpi-service'
import { getIncidentDashboardSnapshotQuery } from '@/modules/incidents/server/queries'
import { getGeneralStats, getReceiptStatusBreakdown } from './repository'

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
