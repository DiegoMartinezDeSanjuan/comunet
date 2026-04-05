import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import {
    type IncidentListFilters,
    type PaginationInput,
    findIncidentByIdForOffice,
    findIncidentPageByOffice,
    getIncidentDashboardSnapshotForOffice,
} from './repository'
import { listIncidentTimeline } from './services'
import { mapCommentVisibilityFromDb } from '../policy'
import { listCommunitiesWithUnitsForOffice } from '@/modules/communities/server/repository'
import { listProviderOptionsForOffice } from '@/modules/providers/server/repository'
import { listUserOptionsForOffice } from '@/modules/users/server/repository'

async function requireIncidentsReadAccess() {
    const session = await requireAuth()

    if (!requirePermission(session, 'incidents.read')) {
        throw new Error('FORBIDDEN')
    }

    return session
}

export async function listIncidentsQuery(
    filters: IncidentListFilters = {},
    pagination: PaginationInput = {},
) {
    const session = await requireIncidentsReadAccess()

    return findIncidentPageByOffice(session.officeId, filters, pagination)
}

export async function getIncidentDetailQuery(incidentId: string) {
    const session = await requireIncidentsReadAccess()

    const incident = await findIncidentByIdForOffice(incidentId, session.officeId)

    if (!incident) {
        return null
    }

    return {
        ...incident,
        comments: incident.comments.map((comment) => ({
            ...comment,
            visibility: mapCommentVisibilityFromDb(comment.visibility),
        })),
    }
}

export async function listIncidentTimelineQuery(incidentId: string) {
    const session = await requireIncidentsReadAccess()

    return listIncidentTimeline(session.officeId, incidentId)
}

export async function getIncidentDashboardSnapshotQuery() {
    const session = await requireIncidentsReadAccess()

    return getIncidentDashboardSnapshotForOffice(session.officeId)
}

/**
 * Aggregator: returns all dropdown options needed by the incidents list page.
 * Keeps the permissions boundary inside the incidents module.
 */
export async function getIncidentFilterOptionsQuery() {
    const session = await requireIncidentsReadAccess()

    const [communities, providers, creators] = await Promise.all([
        listCommunitiesWithUnitsForOffice(session.officeId),
        listProviderOptionsForOffice(session.officeId),
        listUserOptionsForOffice(session.officeId),
    ])

    return { communities, providers, creators }
}

/**
 * Aggregator: returns incident detail, timeline, and provider options
 * for the incident detail page. Single call replaces 3 separate queries.
 */
export async function getIncidentDetailWithOptionsQuery(incidentId: string) {
    const session = await requireIncidentsReadAccess()

    const [incident, timeline, providerOptions] = await Promise.all([
        findIncidentByIdForOffice(incidentId, session.officeId).then((inc) => {
            if (!inc) return null
            return {
                ...inc,
                comments: inc.comments.map((comment) => ({
                    ...comment,
                    visibility: mapCommentVisibilityFromDb(comment.visibility),
                })),
            }
        }),
        listIncidentTimeline(session.officeId, incidentId),
        listProviderOptionsForOffice(session.officeId),
    ])

    return { incident, timeline, providerOptions }
}
