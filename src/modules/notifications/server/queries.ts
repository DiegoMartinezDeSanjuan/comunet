import 'server-only'

import { isBackofficeRole, requireAuth } from '@/lib/auth'
import {
    listNotificationPageForUser,
    markNotificationReadRecord,
    type NotificationListFilters,
    type PaginationInput,
} from './repository'

async function requireNotificationsAccess() {
    const session = await requireAuth()

    if (!isBackofficeRole(session.role)) {
        throw new Error('FORBIDDEN')
    }

    return session
}

export async function listMyNotificationsQuery(
    filters: NotificationListFilters = {},
    pagination: PaginationInput = {},
) {
    const session = await requireNotificationsAccess()

    return listNotificationPageForUser(session.officeId, session.userId, filters, pagination)
}

export async function markMyNotificationAsReadQuery(notificationId: string) {
    const session = await requireNotificationsAccess()

    return markNotificationReadRecord(session.officeId, session.userId, notificationId)
}
