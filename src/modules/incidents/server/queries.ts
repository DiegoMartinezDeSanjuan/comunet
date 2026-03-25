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
