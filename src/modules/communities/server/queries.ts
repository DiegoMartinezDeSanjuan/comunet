import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import {
    findCommunitiesByOffice,
    findCommunityById,
} from './repository'
import { computeFinanceKPIs } from '@/modules/finances/server/kpi-service'
import { getOwners } from '@/modules/contacts/server/contact-service'
import { getCommunityFeeRulesService } from '@/modules/finances/server/fee-rule-service'
import { getCommunityUnitsData } from '@/modules/units/server/unit-service'

/* ─── Public queries ─────────────────────────────────────────── */

/**
 * Community detail page — community data + finance KPIs.
 */
export async function getCommunityDetailPageDataQuery(communityId: string) {
    const session = await requireAuth()

    const community = await findCommunityById(communityId, session.officeId)

    if (!community) {
        return null
    }

    const financeKPIs = await computeFinanceKPIs(community.id)

    return { community, financeKPIs, session }
}

/**
 * Communities list page — all communities for the office.
 */
export async function listCommunitiesPageQuery(search?: string) {
    const session = await requireAuth()

    const communities = await findCommunitiesByOffice(session.officeId, search)

    return { communities, session }
}

/**
 * Community edit page — requires communities.manage permission.
 */
export async function getCommunityEditDataQuery(communityId: string) {
    const session = await requireAuth()

    if (!requirePermission(session, 'communities.manage')) {
        throw new Error('FORBIDDEN')
    }

    const community = await findCommunityById(communityId, session.officeId)

    if (!community) {
        return null
    }

    return { community, session }
}

/**
 * Community board page — community + all owners for the office.
 */
export async function getCommunityBoardPageQuery(communityId: string) {
    const session = await requireAuth()

    if (!requirePermission(session, 'communities.manage')) {
        throw new Error('FORBIDDEN')
    }

    const [community, allOwners] = await Promise.all([
        findCommunityById(communityId, session.officeId),
        getOwners(session.officeId),
    ])

    if (!community) {
        return null
    }

    return { community, allOwners, session }
}

/**
 * Community fee-rules page — community + fee rules.
 */
export async function getCommunityFeeRulesPageQuery(communityId: string) {
    const session = await requireAuth()

    const [community, rules] = await Promise.all([
        findCommunityById(communityId, session.officeId),
        getCommunityFeeRulesService(communityId),
    ])

    if (!community) {
        return null
    }

    return { community, rules, session }
}

/**
 * New fee-rule page — requires finances.manage permission.
 */
export async function getCommunityNewFeeRulePageQuery(communityId: string) {
    const session = await requireAuth()

    if (!requirePermission(session, 'finances.manage')) {
        throw new Error('FORBIDDEN')
    }

    const community = await findCommunityById(communityId, session.officeId)

    if (!community) {
        return null
    }

    return { community }
}

/**
 * Community units page — community + buildings + units.
 */
export async function getCommunityUnitsPageQuery(communityId: string) {
    const session = await requireAuth()

    const [community, unitsData] = await Promise.all([
        findCommunityById(communityId, session.officeId),
        getCommunityUnitsData(communityId),
    ])

    if (!community) {
        return null
    }

    return { community, buildings: unitsData.buildings, units: unitsData.units, session }
}

/**
 * New unit page — requires communities.manage permission + buildings list.
 */
export async function getCommunityNewUnitPageQuery(communityId: string) {
    const session = await requireAuth()

    if (!requirePermission(session, 'communities.manage')) {
        throw new Error('FORBIDDEN')
    }

    const unitsData = await getCommunityUnitsData(communityId)

    return { buildings: unitsData.buildings, session }
}

/**
 * Edit unit page — requires communities.manage permission + buildings + unit data.
 */
export async function getCommunityEditUnitPageQuery(communityId: string, unitId: string) {
    const session = await requireAuth()

    if (!requirePermission(session, 'communities.manage')) {
        throw new Error('FORBIDDEN')
    }

    const unitsData = await getCommunityUnitsData(communityId)
    const unit = unitsData.units.find((u: any) => u.id === unitId)

    if (!unit) {
        return null
    }

    return { buildings: unitsData.buildings, unit, session }
}

/**
 * Unit ownership page — requires communities.manage + unit data + all owners.
 */
export async function getCommunityUnitOwnershipPageQuery(communityId: string, unitId: string) {
    const session = await requireAuth()

    if (!requirePermission(session, 'communities.manage')) {
        throw new Error('FORBIDDEN')
    }

    const [{ units }, allOwners] = await Promise.all([
        getCommunityUnitsData(communityId),
        getOwners(session.officeId),
    ])

    const unit = units.find((u: any) => u.id === unitId)

    if (!unit) {
        return null
    }

    return { unit, allOwners, session }
}

/**
 * New building page — guard-only, requires communities.manage.
 */
export async function requireCommunityManageQuery() {
    const session = await requireAuth()

    if (!requirePermission(session, 'communities.manage')) {
        throw new Error('FORBIDDEN')
    }

    return { session }
}
