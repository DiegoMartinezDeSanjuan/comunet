import 'server-only'

import {
    addIncidentCommentSchema,
    assignProviderSchema,
    changeIncidentStatusSchema,
    createIncidentSchema,
    type CreateIncidentInput,
    updateIncidentSchema,
    type UpdateIncidentInput,
} from '@/modules/incidents/schema'
import { logAudit } from '@/modules/audit/server/services'
import {
    createIncidentCommentRecord,
    createIncidentRecord,
    findIncidentByIdForOffice,
    listIncidentTimelineRecords,
    updateIncidentRecord,
} from './repository'
import {
    canTransitionIncidentStatus,
    deriveIncidentResolvedAt,
    deriveIncidentStatusAfterProviderAssignment,
    isClosedIncidentStatus,
    mapCommentVisibilityFromDb,
    mapCommentVisibilityToDb,
} from '../policy'
import {
    notifyIncidentAssigned,
    notifyIncidentCreated,
    notifyIncidentResolved,
    notifySharedIncidentComment,
} from '@/modules/notifications/server/services'
import { prisma } from '@/lib/db'

async function assertCommunityInOffice(communityId: string, officeId: string) {
    const community = await prisma.community.findFirst({
        where: {
            id: communityId,
            officeId,
            archivedAt: null,
        },
    })

    if (!community) {
        throw new Error('Comunidad fuera de alcance')
    }

    return community
}

async function assertUnitInCommunity(unitId: string, communityId: string) {
    const unit = await prisma.unit.findFirst({
        where: {
            id: unitId,
            communityId,
        },
    })

    if (!unit) {
        throw new Error('Unidad fuera de alcance')
    }

    return unit
}

async function assertProviderInOffice(providerId: string, officeId: string) {
    const provider = await prisma.provider.findFirst({
        where: {
            id: providerId,
            officeId,
        },
    })

    if (!provider) {
        throw new Error('Proveedor fuera de alcance')
    }

    if (provider.archivedAt) {
        throw new Error('No se puede asignar un proveedor archivado')
    }

    return provider
}

export async function createIncident(
    officeId: string,
    userId: string,
    input: CreateIncidentInput,
) {
    const parsed = createIncidentSchema.parse(input)

    await assertCommunityInOffice(parsed.communityId, officeId)

    if (parsed.unitId) {
        await assertUnitInCommunity(parsed.unitId, parsed.communityId)
    }

    let provider = null as Awaited<ReturnType<typeof assertProviderInOffice>> | null

    if (parsed.assignedProviderId) {
        provider = await assertProviderInOffice(parsed.assignedProviderId, officeId)
    }

    const initialStatus = parsed.assignedProviderId
        ? deriveIncidentStatusAfterProviderAssignment('OPEN')
        : 'OPEN'

    const incident = await createIncidentRecord({
        communityId: parsed.communityId,
        unitId: parsed.unitId ?? null,
        createdByUserId: userId,
        assignedProviderId: parsed.assignedProviderId ?? null,
        title: parsed.title,
        description: parsed.description ?? null,
        priority: parsed.priority,
        status: initialStatus,
        reportedAt: parsed.reportedAt ? new Date(parsed.reportedAt) : new Date(),
        dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
        resolvedAt: null,
    })

    logAudit({
        officeId,
        userId,
        entityType: 'INCIDENT',
        entityId: incident.id,
        action: 'CREATE',
        meta: {
            title: incident.title,
            priority: incident.priority,
            status: incident.status,
            assignedProviderId: incident.assignedProviderId,
        },
    })

    await notifyIncidentCreated({
        officeId,
        communityId: incident.communityId,
        actorUserId: userId,
        incidentId: incident.id,
        incidentTitle: incident.title,
    })

    if (provider) {
        await notifyIncidentAssigned({
            officeId,
            communityId: incident.communityId,
            actorUserId: userId,
            incidentId: incident.id,
            incidentTitle: incident.title,
            providerId: provider.id,
            providerName: provider.name,
            createdByUserId: incident.createdBy.id,
        })
    }

    return incident
}

export async function updateIncident(
    officeId: string,
    userId: string,
    incidentId: string,
    input: UpdateIncidentInput,
) {
    const parsed = updateIncidentSchema.parse(input)

    const current = await findIncidentByIdForOffice(incidentId, officeId)

    if (!current) {
        throw new Error('Incidencia no encontrada')
    }

    if (current.status === 'CLOSED') {
        throw new Error('La incidencia cerrada no admite cambios de edición')
    }

    const nextCommunityId = parsed.communityId ?? current.communityId
    const nextUnitId = parsed.unitId === undefined ? current.unitId : parsed.unitId

    if (parsed.communityId) {
        await assertCommunityInOffice(parsed.communityId, officeId)
    }

    if (nextUnitId) {
        await assertUnitInCommunity(nextUnitId, nextCommunityId)
    }

    const updated = await updateIncidentRecord(incidentId, {
        communityId: nextCommunityId,
        unitId: nextUnitId ?? null,
        title: parsed.title ?? current.title,
        description: parsed.description === undefined ? current.description : parsed.description ?? null,
        priority: parsed.priority ?? current.priority,
        dueAt: parsed.dueAt === undefined
            ? current.dueAt
            : parsed.dueAt
                ? new Date(parsed.dueAt)
                : null,
    })

    logAudit({
        officeId,
        userId,
        entityType: 'INCIDENT',
        entityId: updated.id,
        action: 'UPDATE',
        meta: {
            previous: {
                communityId: current.communityId,
                unitId: current.unitId,
                title: current.title,
                description: current.description,
                priority: current.priority,
                dueAt: current.dueAt?.toISOString() ?? null,
            },
            next: {
                communityId: updated.communityId,
                unitId: updated.unitId,
                title: updated.title,
                description: updated.description,
                priority: updated.priority,
                dueAt: updated.dueAt?.toISOString() ?? null,
            },
        },
    })

    return updated
}

export async function assignProviderToIncident(
    officeId: string,
    userId: string,
    input: { incidentId: string; providerId: string },
) {
    const parsed = assignProviderSchema.parse(input)

    const [incident, provider] = await Promise.all([
        findIncidentByIdForOffice(parsed.incidentId, officeId),
        assertProviderInOffice(parsed.providerId, officeId),
    ])

    if (!incident) {
        throw new Error('Incidencia no encontrada')
    }

    if (incident.status === 'CLOSED') {
        throw new Error('No se puede asignar proveedor a una incidencia cerrada')
    }

    const nextStatus = deriveIncidentStatusAfterProviderAssignment(incident.status)
    const nextResolvedAt = nextStatus === incident.status
        ? incident.resolvedAt
        : deriveIncidentResolvedAt(incident.resolvedAt, nextStatus)

    const updated = await updateIncidentRecord(incident.id, {
        assignedProviderId: provider.id,
        status: nextStatus,
        resolvedAt: nextResolvedAt,
    })

    logAudit({
        officeId,
        userId,
        entityType: 'INCIDENT',
        entityId: updated.id,
        action: 'UPDATE',
        meta: {
            type: 'PROVIDER_ASSIGNMENT',
            previousProviderId: incident.assignedProviderId,
            nextProviderId: provider.id,
            previousStatus: incident.status,
            nextStatus,
        },
    })

    if (incident.status !== nextStatus) {
        logAudit({
            officeId,
            userId,
            entityType: 'INCIDENT',
            entityId: updated.id,
            action: 'STATUS_CHANGE',
            meta: {
                previousStatus: incident.status,
                nextStatus,
            },
        })
    }

    await notifyIncidentAssigned({
        officeId,
        communityId: updated.communityId,
        actorUserId: userId,
        incidentId: updated.id,
        incidentTitle: updated.title,
        providerId: provider.id,
        providerName: provider.name,
        createdByUserId: updated.createdBy.id,
    })

    return updated
}

export async function changeIncidentStatus(
    officeId: string,
    userId: string,
    input: { incidentId: string; status: string },
) {
    const parsed = changeIncidentStatusSchema.parse(input)

    const current = await findIncidentByIdForOffice(parsed.incidentId, officeId)

    if (!current) {
        throw new Error('Incidencia no encontrada')
    }

    if (!canTransitionIncidentStatus(current.status, parsed.status)) {
        throw new Error(`Transición no permitida: ${current.status} -> ${parsed.status}`)
    }

    if (isClosedIncidentStatus(current.status) && current.status !== parsed.status) {
        throw new Error('La incidencia cerrada no admite cambios arbitrarios')
    }

    const resolvedAt = deriveIncidentResolvedAt(current.resolvedAt, parsed.status)

    const updated = await updateIncidentRecord(parsed.incidentId, {
        status: parsed.status,
        resolvedAt,
    })

    logAudit({
        officeId,
        userId,
        entityType: 'INCIDENT',
        entityId: updated.id,
        action: 'STATUS_CHANGE',
        meta: {
            previousStatus: current.status,
            nextStatus: updated.status,
            previousResolvedAt: current.resolvedAt?.toISOString() ?? null,
            nextResolvedAt: updated.resolvedAt?.toISOString() ?? null,
        },
    })

    if (parsed.status === 'RESOLVED' || parsed.status === 'CLOSED') {
        await notifyIncidentResolved({
            officeId,
            communityId: updated.communityId,
            actorUserId: userId,
            incidentId: updated.id,
            incidentTitle: updated.title,
            createdByUserId: updated.createdBy.id,
        })
    }

    return updated
}

export async function addIncidentComment(
    officeId: string,
    userId: string,
    input: { incidentId: string; body: string; visibility?: 'INTERNAL' | 'SHARED' },
) {
    const parsed = addIncidentCommentSchema.parse(input)

    const incident = await findIncidentByIdForOffice(parsed.incidentId, officeId)

    if (!incident) {
        throw new Error('No se puede comentar una incidencia inexistente o fuera de alcance')
    }

    const comment = await createIncidentCommentRecord({
        incidentId: incident.id,
        authorUserId: userId,
        body: parsed.body,
        visibility: mapCommentVisibilityToDb(parsed.visibility),
    })

    logAudit({
        officeId,
        userId,
        entityType: 'INCIDENT',
        entityId: incident.id,
        action: 'CREATE',
        meta: {
            type: 'INCIDENT_COMMENT',
            commentId: comment.id,
            visibility: parsed.visibility,
        },
    })

    if (parsed.visibility === 'SHARED') {
        await notifySharedIncidentComment({
            officeId,
            communityId: incident.communityId,
            actorUserId: userId,
            incidentId: incident.id,
            incidentTitle: incident.title,
            createdByUserId: incident.createdBy.id,
            assignedProviderId: incident.assignedProviderId,
        })
    }

    return {
        ...comment,
        visibility: mapCommentVisibilityFromDb(comment.visibility),
    }
}

export async function listIncidentTimeline(
    officeId: string,
    incidentId: string,
) {
    const incident = await findIncidentByIdForOffice(incidentId, officeId)

    if (!incident) {
        throw new Error('Incidencia no encontrada')
    }

    const timeline = await listIncidentTimelineRecords(officeId, incidentId)

    return timeline.map((entry) => {
        if (entry.kind !== 'COMMENT') {
            return entry
        }

        return {
            ...entry,
            visibility: mapCommentVisibilityFromDb(entry.visibility),
        }
    })
}
