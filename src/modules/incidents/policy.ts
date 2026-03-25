import type {
    CommentVisibility,
    IncidentStatus,
    UserRole,
} from '@prisma/client'

export const INCIDENT_READ_ROLES: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
]

export const INCIDENT_MANAGE_ROLES: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
]

export const PROVIDER_READ_ROLES: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
]

export const PROVIDER_MANAGE_ROLES: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
]

const CLOSED_STATUSES: IncidentStatus[] = ['RESOLVED', 'CLOSED']

const INCIDENT_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
    OPEN: ['ASSIGNED', 'IN_PROGRESS', 'WAITING_VENDOR', 'RESOLVED'],
    ASSIGNED: ['OPEN', 'IN_PROGRESS', 'WAITING_VENDOR', 'RESOLVED'],
    IN_PROGRESS: ['ASSIGNED', 'WAITING_VENDOR', 'RESOLVED'],
    WAITING_VENDOR: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
    RESOLVED: ['CLOSED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_VENDOR'],
    CLOSED: [],
}

export type IncidentCommentVisibilityInput = 'INTERNAL' | 'SHARED'

export function canReadIncidentByRole(role: UserRole): boolean {
    return INCIDENT_READ_ROLES.includes(role)
}

export function canManageIncidentByRole(role: UserRole): boolean {
    return INCIDENT_MANAGE_ROLES.includes(role)
}

export function canAssignProviderByRole(role: UserRole): boolean {
    return INCIDENT_MANAGE_ROLES.includes(role)
}

export function canCommentIncidentByRole(role: UserRole): boolean {
    return INCIDENT_MANAGE_ROLES.includes(role)
}

export function canReadProviderByRole(role: UserRole): boolean {
    return PROVIDER_READ_ROLES.includes(role)
}

export function canManageProviderByRole(role: UserRole): boolean {
    return PROVIDER_MANAGE_ROLES.includes(role)
}

export function isClosedIncidentStatus(status: IncidentStatus): boolean {
    return CLOSED_STATUSES.includes(status)
}

export function isOpenIncidentStatus(status: IncidentStatus): boolean {
    return !isClosedIncidentStatus(status)
}

export function canTransitionIncidentStatus(
    currentStatus: IncidentStatus,
    nextStatus: IncidentStatus,
): boolean {
    if (currentStatus === nextStatus) {
        return true
    }

    return INCIDENT_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)
}

export function deriveIncidentStatusAfterProviderAssignment(
    currentStatus: IncidentStatus,
): IncidentStatus {
    return currentStatus === 'OPEN' ? 'ASSIGNED' : currentStatus
}

export function deriveIncidentResolvedAt(
    currentResolvedAt: Date | null,
    nextStatus: IncidentStatus,
    now: Date = new Date(),
): Date | null {
    if (nextStatus === 'RESOLVED' || nextStatus === 'CLOSED') {
        return currentResolvedAt ?? now
    }

    return null
}

export function mapCommentVisibilityToDb(
    visibility: IncidentCommentVisibilityInput,
): CommentVisibility {
    // Temporary storage compatibility:
    // current Prisma enum is PUBLIC | INTERNAL.
    // Slice 2.3 domain works with INTERNAL | SHARED.
    return visibility === 'SHARED'
        ? ('PUBLIC' as CommentVisibility)
        : ('INTERNAL' as CommentVisibility)
}

export function mapCommentVisibilityFromDb(
    visibility: CommentVisibility,
): IncidentCommentVisibilityInput {
    return visibility === 'PUBLIC' ? 'SHARED' : 'INTERNAL'
}
