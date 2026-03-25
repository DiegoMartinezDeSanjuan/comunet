'use server'

import { revalidatePath } from 'next/cache'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import type {
    AddIncidentCommentInput,
    AssignProviderInput,
    ChangeIncidentStatusInput,
    CreateIncidentInput,
    UpdateIncidentInput,
} from '@/modules/incidents/schema'
import {
    addIncidentComment,
    assignProviderToIncident,
    changeIncidentStatus,
    createIncident,
    updateIncident,
} from './services'

async function getOfficeAndUser(permission: string) {
    const session = await requireAuth()

    if (!requirePermission(session, permission)) {
        throw new Error('FORBIDDEN')
    }

    return {
        officeId: session.officeId,
        userId: session.userId,
    }
}

export async function createIncidentAction(input: CreateIncidentInput) {
    const { officeId, userId } = await getOfficeAndUser('incidents.manage')

    const incident = await createIncident(officeId, userId, input)

    revalidatePath('/incidents')
    revalidatePath('/dashboard')
    revalidatePath(`/communities/${incident.communityId}`)

    return incident
}

export async function updateIncidentAction(
    incidentId: string,
    input: UpdateIncidentInput,
) {
    const { officeId, userId } = await getOfficeAndUser('incidents.manage')

    const incident = await updateIncident(officeId, userId, incidentId, input)

    revalidatePath('/incidents')
    revalidatePath(`/incidents/${incident.id}`)
    revalidatePath('/dashboard')

    return incident
}

export async function assignProviderToIncidentAction(input: AssignProviderInput) {
    const { officeId, userId } = await getOfficeAndUser('incidents.manage')

    const incident = await assignProviderToIncident(officeId, userId, input)

    revalidatePath('/incidents')
    revalidatePath(`/incidents/${incident.id}`)
    revalidatePath(`/providers/${incident.assignedProviderId}`)
    revalidatePath('/dashboard')

    return incident
}

export async function changeIncidentStatusAction(input: ChangeIncidentStatusInput) {
    const { officeId, userId } = await getOfficeAndUser('incidents.manage')

    const incident = await changeIncidentStatus(officeId, userId, input)

    revalidatePath('/incidents')
    revalidatePath(`/incidents/${incident.id}`)
    revalidatePath('/dashboard')

    return incident
}

export async function addIncidentCommentAction(input: AddIncidentCommentInput) {
    const { officeId, userId } = await getOfficeAndUser('incidents.manage')

    const comment = await addIncidentComment(officeId, userId, input)

    revalidatePath('/incidents')
    revalidatePath(`/incidents/${comment.incidentId}`)
    revalidatePath('/dashboard')

    return comment
}
