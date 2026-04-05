import 'server-only'

import { requireAuth } from '@/lib/auth'
import { getCommunityDetails } from './service'
import { computeFinanceKPIs } from '@/modules/finances/server/kpi-service'

/**
 * Aggregator for the community detail page.
 * Resolves auth internally and returns community data + finance KPIs.
 */
export async function getCommunityDetailPageDataQuery(communityId: string) {
    const session = await requireAuth()

    const community = await getCommunityDetails(communityId, session.officeId)

    if (!community) {
        return null
    }

    const financeKPIs = await computeFinanceKPIs(community.id)

    return { community, financeKPIs, session }
}
