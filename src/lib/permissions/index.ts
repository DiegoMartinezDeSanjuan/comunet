import 'server-only'

import { UserRole } from '@prisma/client'

import type { Session } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createRequestCache } from '@/lib/request-cache'

export interface PermissionContext {
  communityId?: string
  unitId?: string
  ownerId?: string
  providerId?: string
  incidentId?: string
}

// ─── Cached DB Fetchers ─────────────────────────────────

const getCommunityForOffice = createRequestCache(async (communityId: string, officeId: string) => {
  return prisma.community.findFirst({
    where: { id: communityId, officeId, archivedAt: null },
  })
})

const getOwnershipForOwner = createRequestCache(async (ownerId: string, communityId: string) => {
  return prisma.ownership.findFirst({
    where: { ownerId, unit: { communityId }, endDate: null },
  })
})

const getIncidentForProvider = createRequestCache(async (providerId: string, communityId: string) => {
  return prisma.incident.findFirst({
    where: { communityId, assignedProviderId: providerId },
  })
})

const getUnitWithCommunity = createRequestCache(async (unitId: string) => {
  return prisma.unit.findFirst({
    where: { id: unitId },
    include: { community: true },
  })
})

const getOwnershipForUnit = createRequestCache(async (unitId: string, ownerId: string) => {
  return prisma.ownership.findFirst({
    where: { unitId, ownerId, endDate: null },
  })
})

const getOwnerForOffice = createRequestCache(async (ownerId: string, officeId: string) => {
  return prisma.owner.findFirst({
    where: { id: ownerId, officeId, archivedAt: null },
  })
})

const getIncidentForScopeCached = createRequestCache(async (incidentId: string) => {
  return prisma.incident.findFirst({
    where: { id: incidentId },
    include: { community: true },
  })
})

const getProviderForScopeCached = createRequestCache(async (providerId: string) => {
  return prisma.provider.findFirst({
    where: { id: providerId },
  })
})

const getMeetingWithCommunity = createRequestCache(async (meetingId: string) => {
  return prisma.meeting.findFirst({
    where: { id: meetingId },
    include: { community: true },
  })
})

const getDocumentWithCommunity = createRequestCache(async (documentId: string) => {
  return prisma.document.findFirst({
    where: { id: documentId, archivedAt: null },
    include: { community: true },
  })
})

const BACKOFFICE_READ_ROLES: UserRole[] = [
  'SUPERADMIN',
  'OFFICE_ADMIN',
  'MANAGER',
  'ACCOUNTANT',
  'VIEWER',
]

const BACKOFFICE_MANAGE_ROLES: UserRole[] = [
  'SUPERADMIN',
  'OFFICE_ADMIN',
  'MANAGER',
]

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

function isBackofficeReadRole(role: UserRole) {
  return BACKOFFICE_READ_ROLES.includes(role)
}

function isBackofficeManageRole(role: UserRole) {
  return BACKOFFICE_MANAGE_ROLES.includes(role)
}

// ─── Community Permissions ──────────────────────────────

export async function canReadCommunity(session: Session, communityId: string): Promise<boolean> {
  if (isBackofficeReadRole(session.role)) {
    const community = await getCommunityForOffice(communityId, session.officeId)
    return !!community
  }

  if ((session.role === 'OWNER' || session.role === 'PRESIDENT') && session.linkedOwnerId) {
    const ownership = await getOwnershipForOwner(session.linkedOwnerId, communityId)
    return !!ownership
  }

  if (session.role === 'PROVIDER' && session.linkedProviderId) {
    const incident = await getIncidentForProvider(session.linkedProviderId, communityId)
    return !!incident
  }

  return false
}

export async function canManageCommunity(session: Session, communityId: string): Promise<boolean> {
  if (!isBackofficeManageRole(session.role)) return false

  const community = await getCommunityForOffice(communityId, session.officeId)
  return !!community
}

// ─── Unit Permissions ───────────────────────────────────

export async function canReadUnit(session: Session, unitId: string): Promise<boolean> {
  const unit = await getUnitWithCommunity(unitId)
  if (!unit) return false

  if (isBackofficeReadRole(session.role)) {
    return unit.community.officeId === session.officeId
  }

  if ((session.role === 'OWNER' || session.role === 'PRESIDENT') && session.linkedOwnerId) {
    const ownership = await getOwnershipForUnit(unitId, session.linkedOwnerId)
    return !!ownership
  }

  return false
}

// ─── Owner Permissions ──────────────────────────────────

export async function canReadOwner(session: Session, ownerId: string): Promise<boolean> {
  if (isBackofficeReadRole(session.role)) {
    const owner = await getOwnerForOffice(ownerId, session.officeId)
    return !!owner
  }

  if ((session.role === 'OWNER' || session.role === 'PRESIDENT') && session.linkedOwnerId) {
    return session.linkedOwnerId === ownerId
  }

  return false
}

// ─── Finance Permissions ────────────────────────────────

export function canManageFinance(session: Session): boolean {
  return FINANCE_MANAGE_ROLES.includes(session.role)
}

// ─── Incident Permissions ───────────────────────────────

async function getIncidentForScope(incidentId: string) {
  return getIncidentForScopeCached(incidentId)
}

export async function canReadIncident(session: Session, incidentId: string): Promise<boolean> {
  const incident = await getIncidentForScope(incidentId)

  if (!incident) return false

  if (isBackofficeReadRole(session.role)) {
    return incident.community.officeId === session.officeId
  }

  if ((session.role === 'OWNER' || session.role === 'PRESIDENT') && session.linkedOwnerId) {
    const ownership = await getOwnershipForOwner(session.linkedOwnerId, incident.communityId)

    if (session.role === 'PRESIDENT') return !!ownership

    return !!ownership && (incident.createdByUserId === session.userId || !incident.unitId)
  }

  if (session.role === 'PROVIDER' && session.linkedProviderId) {
    return incident.assignedProviderId === session.linkedProviderId
  }

  return false
}

export async function canViewIncident(session: Session, incidentId: string): Promise<boolean> {
  return canReadIncident(session, incidentId)
}

export async function canManageIncident(
  session: Session,
  incidentId?: string,
): Promise<boolean> {
  if (!isBackofficeManageRole(session.role)) return false
  if (!incidentId) return true

  const incident = await getIncidentForScope(incidentId)
  if (!incident) return false

  return incident.community.officeId === session.officeId
}

export async function canAssignProvider(session: Session, incidentId: string): Promise<boolean> {
  return canManageIncident(session, incidentId)
}

export async function canCommentIncident(session: Session, incidentId: string): Promise<boolean> {
  if (isBackofficeReadRole(session.role)) {
    return canReadIncident(session, incidentId)
  }

  if (session.role === 'OWNER' || session.role === 'PRESIDENT' || session.role === 'PROVIDER') {
    return canReadIncident(session, incidentId)
  }

  return false
}

// ─── Provider Permissions ───────────────────────────────

async function getProviderForScope(providerId: string) {
  return getProviderForScopeCached(providerId)
}

export async function canReadProvider(session: Session, providerId: string): Promise<boolean> {
  const provider = await getProviderForScope(providerId)
  if (!provider || provider.archivedAt) return false

  if (isBackofficeReadRole(session.role)) {
    return provider.officeId === session.officeId
  }

  if (session.role === 'PROVIDER' && session.linkedProviderId) {
    return session.linkedProviderId === providerId
  }

  return false
}

export async function canManageProvider(session: Session, providerId?: string): Promise<boolean> {
  if (!isBackofficeManageRole(session.role)) return false
  if (!providerId) return true

  const provider = await getProviderForScope(providerId)
  if (!provider || provider.archivedAt) return false

  return provider.officeId === session.officeId
}

// ─── Meeting Permissions ────────────────────────────────

export async function canManageMeeting(session: Session, meetingId: string): Promise<boolean> {
  if (!isBackofficeManageRole(session.role)) return false

  const meeting = await getMeetingWithCommunity(meetingId)

  if (!meeting) return false

  return meeting.community.officeId === session.officeId
}

// ─── Document Permissions ───────────────────────────────

export async function canReadDocument(session: Session, documentId: string): Promise<boolean> {
  const document = await getDocumentWithCommunity(documentId)

  if (!document) return false

  if (isBackofficeReadRole(session.role)) {
    return document.community.officeId === session.officeId
  }

  if ((session.role === 'OWNER' || session.role === 'PRESIDENT') && session.linkedOwnerId) {
    if (document.visibility === 'INTERNAL') return false

    const ownership = await getOwnershipForOwner(session.linkedOwnerId, document.communityId)

    return !!ownership
  }

  return false
}

// ─── Generic Role Check ─────────────────────────────────

export function canReadReports(session: Session): boolean {
  return requirePermission(session, 'reports.read')
}

export function canManageOfficeSettings(session: Session): boolean {
  return requirePermission(session, 'settings.manage')
}

export function canReadSettings(session: Session): boolean {
  return requirePermission(session, 'settings.read')
}

export function canReadUsers(session: Session): boolean {
  return requirePermission(session, 'users.read')
}

export function canManageUsers(session: Session): boolean {
  return requirePermission(session, 'users.manage')
}

export function canReadAudit(session: Session): boolean {
  return requirePermission(session, 'audit.read')
}

export function requirePermission(
  session: Session,
  permission: string,
): boolean {
  const permissionMap: Record<string, UserRole[]> = {
    'communities.read': BACKOFFICE_READ_ROLES,
    'communities.manage': BACKOFFICE_MANAGE_ROLES,

    'owners.read': BACKOFFICE_READ_ROLES,
    'owners.manage': BACKOFFICE_MANAGE_ROLES,

    'finance.read': FINANCE_READ_ROLES,
    'finances.read': FINANCE_READ_ROLES,
    'finance.manage': FINANCE_MANAGE_ROLES,
    'finances.manage': FINANCE_MANAGE_ROLES,

    'incidents.read': BACKOFFICE_READ_ROLES,
    'incidents.manage': BACKOFFICE_MANAGE_ROLES,

    'providers.read': BACKOFFICE_READ_ROLES,
    'providers.manage': BACKOFFICE_MANAGE_ROLES,

    'meetings.read': BACKOFFICE_READ_ROLES,
    'meetings.manage': BACKOFFICE_MANAGE_ROLES,

    'documents.read': BACKOFFICE_READ_ROLES,
    'documents.manage': BACKOFFICE_MANAGE_ROLES,

    'settings.read': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'settings.manage': ['SUPERADMIN', 'OFFICE_ADMIN'],

    'users.read': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
    'users.manage': ['SUPERADMIN', 'OFFICE_ADMIN'],

    'audit.read': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER', 'ACCOUNTANT'],
    
    'reports.read': ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER', 'ACCOUNTANT'],
  }

  const allowedRoles = permissionMap[permission]
  if (!allowedRoles) return false

  return allowedRoles.includes(session.role)
}
