import 'server-only'

import { UserRole } from '@prisma/client'

import type { Session } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface PermissionContext {
  communityId?: string
  unitId?: string
  ownerId?: string
  providerId?: string
  incidentId?: string
}

const FINANCE_READ_ROLES: UserRole[] = [
  'SUPERADMIN',
  'OFFICE_ADMIN',
  'MANAGER',
  'ACCOUNTANT',
  'VIEWER',
]

const FINANCE_MANAGE_ROLES: UserRole[] = [
  'SUPERADMIN',
  'OFFICE_ADMIN',
  'MANAGER',
  'ACCOUNTANT',
]

// ─── Community Permissions ──────────────────────────────
export async function canReadCommunity(
  session: Session,
  communityId: string,
): Promise<boolean> {
  const adminRoles: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
  ]

  if (adminRoles.includes(session.role)) {
    const community = await prisma.community.findFirst({
      where: { id: communityId, officeId: session.officeId, archivedAt: null },
    })

    return !!community
  }

  if (session.role === 'OWNER' || session.role === 'PRESIDENT') {
    if (!session.linkedOwnerId) return false

    const ownership = await prisma.ownership.findFirst({
      where: {
        ownerId: session.linkedOwnerId,
        unit: { communityId },
        endDate: null,
      },
    })

    return !!ownership
  }

  if (session.role === 'PROVIDER') {
    if (!session.linkedProviderId) return false

    const incident = await prisma.incident.findFirst({
      where: { communityId, assignedProviderId: session.linkedProviderId },
    })

    return !!incident
  }

  return false
}

export async function canManageCommunity(
  session: Session,
  communityId: string,
): Promise<boolean> {
  const manageRoles: UserRole[] = ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER']
  if (!manageRoles.includes(session.role)) return false

  const community = await prisma.community.findFirst({
    where: { id: communityId, officeId: session.officeId, archivedAt: null },
  })

  return !!community
}

// ─── Unit Permissions ───────────────────────────────────
export async function canReadUnit(
  session: Session,
  unitId: string,
): Promise<boolean> {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId },
    include: { community: true },
  })

  if (!unit) return false

  const adminRoles: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
  ]

  if (adminRoles.includes(session.role)) {
    return unit.community.officeId === session.officeId
  }

  if (
    (session.role === 'OWNER' || session.role === 'PRESIDENT') &&
    session.linkedOwnerId
  ) {
    const ownership = await prisma.ownership.findFirst({
      where: { unitId, ownerId: session.linkedOwnerId, endDate: null },
    })

    return !!ownership
  }

  return false
}

// ─── Owner Permissions ──────────────────────────────────
export async function canReadOwner(
  session: Session,
  ownerId: string,
): Promise<boolean> {
  const adminRoles: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
  ]

  if (adminRoles.includes(session.role)) {
    const owner = await prisma.owner.findFirst({
      where: { id: ownerId, officeId: session.officeId, archivedAt: null },
    })

    return !!owner
  }

  if (
    (session.role === 'OWNER' || session.role === 'PRESIDENT') &&
    session.linkedOwnerId
  ) {
    return session.linkedOwnerId === ownerId
  }

  return false
}

// ─── Finance Permissions ────────────────────────────────
export function canManageFinance(session: Session): boolean {
  return FINANCE_MANAGE_ROLES.includes(session.role)
}

// ─── Incident Permissions ───────────────────────────────
export async function canViewIncident(
  session: Session,
  incidentId: string,
): Promise<boolean> {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId },
    include: { community: true },
  })

  if (!incident) return false

  const adminRoles: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
  ]

  if (adminRoles.includes(session.role)) {
    return incident.community.officeId === session.officeId
  }

  if (
    (session.role === 'OWNER' || session.role === 'PRESIDENT') &&
    session.linkedOwnerId
  ) {
    // Owner can see incidents in their communities
    const ownership = await prisma.ownership.findFirst({
      where: {
        ownerId: session.linkedOwnerId,
        unit: { communityId: incident.communityId },
        endDate: null,
      },
    })

    if (session.role === 'PRESIDENT') return !!ownership

    // Regular owner: only their own incidents or public community incidents
    return !!ownership &&
      (incident.createdByUserId === session.userId || !incident.unitId)
  }

  if (session.role === 'PROVIDER' && session.linkedProviderId) {
    return incident.assignedProviderId === session.linkedProviderId
  }

  return false
}

export async function canCommentIncident(
  session: Session,
  incidentId: string,
): Promise<boolean> {
  return canViewIncident(session, incidentId)
}

// ─── Meeting Permissions ────────────────────────────────
export async function canManageMeeting(
  session: Session,
  meetingId: string,
): Promise<boolean> {
  const manageRoles: UserRole[] = ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER']
  if (!manageRoles.includes(session.role)) return false

  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId },
    include: { community: true },
  })

  if (!meeting) return false
  return meeting.community.officeId === session.officeId
}

// ─── Document Permissions ───────────────────────────────
export async function canReadDocument(
  session: Session,
  documentId: string,
): Promise<boolean> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, archivedAt: null },
    include: { community: true },
  })

  if (!doc) return false

  const adminRoles: UserRole[] = [
    'SUPERADMIN',
    'OFFICE_ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'VIEWER',
  ]

  if (adminRoles.includes(session.role)) {
    return doc.community.officeId === session.officeId
  }

  if (
    (session.role === 'OWNER' || session.role === 'PRESIDENT') &&
    session.linkedOwnerId
  ) {
    if (doc.visibility === 'INTERNAL') return false

    const ownership = await prisma.ownership.findFirst({
      where: {
        ownerId: session.linkedOwnerId,
        unit: { communityId: doc.communityId },
        endDate: null,
      },
    })

    return !!ownership
  }

  return false
}

// ─── Generic Role Check ─────────────────────────────────
export function requirePermission(
  session: Session,
  permission: string,
  _context?: PermissionContext,
): boolean {
  // Generic permission check - extendable
  const permissionMap: Record<string, UserRole[]> = {
    'communities.read': [
      'SUPERADMIN',
      'OFFICE_ADMIN',
      'MANAGER',
      'ACCOUNTANT',
      'VIEWER',
    ],
    'communities.manage': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'owners.read': [
      'SUPERADMIN',
      'OFFICE_ADMIN',
      'MANAGER',
      'ACCOUNTANT',
      'VIEWER',
    ],
    'owners.manage': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'finance.read': FINANCE_READ_ROLES,
    'finances.read': FINANCE_READ_ROLES,
    'finance.manage': FINANCE_MANAGE_ROLES,
    'finances.manage': FINANCE_MANAGE_ROLES,
    'incidents.read': [
      'SUPERADMIN',
      'OFFICE_ADMIN',
      'MANAGER',
      'ACCOUNTANT',
      'VIEWER',
    ],
    'incidents.manage': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'meetings.read': [
      'SUPERADMIN',
      'OFFICE_ADMIN',
      'MANAGER',
      'ACCOUNTANT',
      'VIEWER',
    ],
    'meetings.manage': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'documents.read': [
      'SUPERADMIN',
      'OFFICE_ADMIN',
      'MANAGER',
      'ACCOUNTANT',
      'VIEWER',
    ],
    'documents.manage': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'providers.read': [
      'SUPERADMIN',
      'OFFICE_ADMIN',
      'MANAGER',
      'ACCOUNTANT',
      'VIEWER',
    ],
    'providers.manage': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'settings.read': ['SUPERADMIN', 'OFFICE_ADMIN'],
    'settings.manage': ['SUPERADMIN', 'OFFICE_ADMIN'],
    'audit.read': ['SUPERADMIN', 'OFFICE_ADMIN'],
  }

  const allowedRoles = permissionMap[permission]
  if (!allowedRoles) return false

  return allowedRoles.includes(session.role)
}
