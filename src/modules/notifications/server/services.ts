import 'server-only'

import { isBackofficeRole } from '@/lib/auth'
import {
    createNotificationRecord,
    listActiveUsersByRoles,
    listLinkedUsersForProvider,
} from './repository'
import type { NotificationChannel, NotificationStatus, UserRole } from '@prisma/client'

interface CreateNotificationInput {
    officeId: string
    communityId?: string | null
    recipientUserId?: string | null
    channel?: NotificationChannel
    title: string
    body?: string | null
    status?: NotificationStatus
}

interface IncidentNotificationInput {
    officeId: string
    communityId: string
    actorUserId: string
    incidentId: string
    incidentTitle: string
}

const INCIDENT_NOTIFICATION_ROLES: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
]

export async function createNotification(input: CreateNotificationInput) {
    return createNotificationRecord({
        officeId: input.officeId,
        communityId: input.communityId ?? null,
        recipientUserId: input.recipientUserId ?? null,
        channel: input.channel ?? 'IN_APP',
        title: input.title,
        body: input.body ?? null,
        status: input.status ?? 'SENT',
        sentAt: new Date(),
    })
}

export async function sendMockEmail(input: {
    to: string
    subject: string
    body: string
}) {
    const payload = {
        to: input.to,
        subject: input.subject,
        body: input.body,
        sentAt: new Date().toISOString(),
    }

    console.log('[MOCK EMAIL ADAPTER]', payload)

    return {
        success: true,
        id: `mock-${Date.now()}`,
    }
}

async function createNotificationsForRecipients(
    recipients: { id: string }[],
    payload: Omit<CreateNotificationInput, 'recipientUserId'>,
) {
    await Promise.all(
        recipients.map((recipient) =>
            createNotification({
                ...payload,
                recipientUserId: recipient.id,
            }),
        ),
    )
}

async function getInternalRecipients(
    officeId: string,
    actorUserId: string,
) {
    const users = await listActiveUsersByRoles(officeId, INCIDENT_NOTIFICATION_ROLES)

    return users.filter((user) => user.id !== actorUserId && isBackofficeRole(user.role))
}

export async function notifyIncidentCreated(input: IncidentNotificationInput) {
    const recipients = await getInternalRecipients(input.officeId, input.actorUserId)

    if (!recipients.length) {
        return
    }

    await createNotificationsForRecipients(recipients, {
        officeId: input.officeId,
        communityId: input.communityId,
        title: 'Nueva incidencia creada',
        body: `Incidencia ${input.incidentTitle} (${input.incidentId}) creada en backoffice.`,
    })
}

export async function notifyIncidentAssigned(
    input: IncidentNotificationInput & {
        providerId: string
        providerName: string
        createdByUserId: string
    },
) {
    const [internalRecipients, providerUsers] = await Promise.all([
        getInternalRecipients(input.officeId, input.actorUserId),
        listLinkedUsersForProvider(input.officeId, input.providerId),
    ])

    const internalIds = new Set<string>([input.actorUserId])
    const recipients = [
        ...internalRecipients.filter((user) => !internalIds.has(user.id)),
        ...providerUsers.filter((user) => user.id !== input.actorUserId),
    ]

    if (!recipients.length) {
        return
    }

    await createNotificationsForRecipients(recipients, {
        officeId: input.officeId,
        communityId: input.communityId,
        title: 'Incidencia asignada',
        body: `La incidencia ${input.incidentTitle} ha sido asignada a ${input.providerName}.`,
    })
}

export async function notifyIncidentResolved(
    input: IncidentNotificationInput & {
        createdByUserId: string
    },
) {
    const internalRecipients = await getInternalRecipients(input.officeId, input.actorUserId)
    const recipientIds = new Set<string>(internalRecipients.map((user) => user.id))

    if (input.createdByUserId !== input.actorUserId) {
        recipientIds.add(input.createdByUserId)
    }

    const recipients = Array.from(recipientIds).map((id) => ({ id }))

    if (!recipients.length) {
        return
    }

    await createNotificationsForRecipients(recipients, {
        officeId: input.officeId,
        communityId: input.communityId,
        title: 'Incidencia resuelta',
        body: `La incidencia ${input.incidentTitle} ha sido marcada como resuelta.`,
    })
}

export async function notifySharedIncidentComment(
    input: IncidentNotificationInput & {
        createdByUserId: string
        assignedProviderId: string | null
    },
) {
    const [internalRecipients, providerUsers] = await Promise.all([
        getInternalRecipients(input.officeId, input.actorUserId),
        input.assignedProviderId
            ? listLinkedUsersForProvider(input.officeId, input.assignedProviderId)
            : Promise.resolve([]),
    ])

    const recipientIds = new Set<string>(internalRecipients.map((user) => user.id))

    if (input.createdByUserId !== input.actorUserId) {
        recipientIds.add(input.createdByUserId)
    }

    for (const user of providerUsers) {
        if (user.id !== input.actorUserId) {
            recipientIds.add(user.id)
        }
    }

    const recipients = Array.from(recipientIds).map((id) => ({ id }))

    if (!recipients.length) {
        return
    }

    await createNotificationsForRecipients(recipients, {
        officeId: input.officeId,
        communityId: input.communityId,
        title: 'Nuevo comentario compartido',
        body: `La incidencia ${input.incidentTitle} tiene un comentario compartido nuevo.`,
    })
}

export async function notifyMeetingScheduled(input: { officeId: string, communityId: string, meetingId: string, title: string }) {
    console.log('[MOCK NOTIFICATION] Meeting Scheduled:', input.title)
}

export async function notifyMinuteApproved(input: { officeId: string, communityId: string, meetingId: string, title: string }) {
    console.log('[MOCK NOTIFICATION] Minute Approved:', input.title)
}

export async function notifyDocumentPublished(input: { officeId: string, communityId: string, documentId: string, title: string }) {
    console.log('[MOCK NOTIFICATION] Document Published:', input.title)
}

