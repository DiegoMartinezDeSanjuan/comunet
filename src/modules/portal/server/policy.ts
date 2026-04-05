import 'server-only'

import type { UserRole } from '@prisma/client'

import type { Session } from '@/lib/auth'
import {
  getPortalOwnershipsDb,
  getPortalPresidentPositionsDb,
  getActiveOwnershipForUnitDb,
  getActiveOwnershipForCommunityDb,
  getActivePresidentPositionDb,
  getReceiptAccessInfoDb,
  getIncidentAccessInfoDb,
} from './repository'

export interface PortalCommunityScopeItem {
  id: string
  name: string
}

export interface PortalUnitScopeItem {
  id: string
  reference: string
  communityId: string
  communityName: string
}

export interface PortalAccessScope {
  ownerId: string | null
  ownedUnits: PortalUnitScopeItem[]
  ownedUnitIds: string[]
  ownedCommunities: PortalCommunityScopeItem[]
  ownedCommunityIds: string[]
  presidentCommunities: PortalCommunityScopeItem[]
  presidentCommunityIds: string[]
}

export interface PortalReceiptAccessRecord {
  ownerId: string
  community?: {
    officeId: string
  } | null
}

export interface PortalIncidentAccessRecord {
  communityId: string
  unitId: string | null
  community?: {
    officeId: string
  } | null
}

interface ActiveDateRangeFilter {
  startDate: {
    lte: Date
  }
  OR: Array<
    | { endDate: null }
    | {
        endDate: {
          gte: Date
        }
      }
  >
}

interface OwnershipScopeRecord {
  unitId: string
  unit: {
    id: string
    reference: string
    communityId: string
    community: {
      id: string
      name: string
    }
  }
}

interface PresidentPositionRecord {
  communityId: string
  community: {
    id: string
    name: string
  }
}

export function isPortalOwnerPresidentRole(role: UserRole): role is 'OWNER' | 'PRESIDENT' {
  return role === 'OWNER' || role === 'PRESIDENT'
}

export function isPortalProviderRole(role: UserRole): role is 'PROVIDER' {
  return role === 'PROVIDER'
}

export function buildActiveDateRangeFilter(at = new Date()): ActiveDateRangeFilter {
  return {
    startDate: { lte: at },
    OR: [{ endDate: null }, { endDate: { gte: at } }],
  }
}

export function isPortalVisibleCommentVisibility(visibility: string | null | undefined): boolean {
  return visibility === 'SHARED' || visibility === 'PUBLIC'
}

export function filterPortalVisibleComments<T extends { visibility: string | null | undefined }>(
  comments: T[],
): Array<Omit<T, 'visibility'> & { visibility: 'SHARED' }> {
  return comments
    .filter((comment) => isPortalVisibleCommentVisibility(comment.visibility))
    .map((comment) => ({
      ...comment,
      visibility: 'SHARED' as const,
    }))
}

export async function getPortalAccessScope(
  session: Session,
  at = new Date(),
): Promise<PortalAccessScope> {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return {
      ownerId: session.linkedOwnerId,
      ownedUnits: [],
      ownedUnitIds: [],
      ownedCommunities: [],
      ownedCommunityIds: [],
      presidentCommunities: [],
      presidentCommunityIds: [],
    }
  }

  const ownershipsPromise = getPortalOwnershipsDb(
    session.linkedOwnerId,
    buildActiveDateRangeFilter(at),
    session.officeId,
  ) as any

  const presidentPositionsPromise: Promise<PresidentPositionRecord[]> =
    session.role === 'PRESIDENT'
      ? (getPortalPresidentPositionsDb(
          session.linkedOwnerId,
          buildActiveDateRangeFilter(at),
          session.officeId,
        ) as any)
      : Promise.resolve<PresidentPositionRecord[]>([])

  const [ownerships, presidentPositions] = await Promise.all([
    ownershipsPromise,
    presidentPositionsPromise,
  ])

  const unitMap = new Map<string, PortalUnitScopeItem>()
  const communityMap = new Map<string, PortalCommunityScopeItem>()
  const presidentCommunityMap = new Map<string, PortalCommunityScopeItem>()

  for (const ownership of ownerships) {
    unitMap.set(ownership.unit.id, {
      id: ownership.unit.id,
      reference: ownership.unit.reference,
      communityId: ownership.unit.communityId,
      communityName: ownership.unit.community.name,
    })

    communityMap.set(ownership.unit.community.id, {
      id: ownership.unit.community.id,
      name: ownership.unit.community.name,
    })
  }

  for (const position of presidentPositions) {
    presidentCommunityMap.set(position.community.id, {
      id: position.community.id,
      name: position.community.name,
    })
  }

  const ownedUnits = Array.from(unitMap.values()).sort((left, right) => {
    const communityComparison = left.communityName.localeCompare(right.communityName, 'es')
    if (communityComparison !== 0) return communityComparison
    return left.reference.localeCompare(right.reference, 'es')
  })

  const ownedCommunities = Array.from(communityMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'es'),
  )

  const presidentCommunities = Array.from(presidentCommunityMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'es'),
  )

  return {
    ownerId: session.linkedOwnerId,
    ownedUnits,
    ownedUnitIds: ownedUnits.map((unit) => unit.id),
    ownedCommunities,
    ownedCommunityIds: ownedCommunities.map((community) => community.id),
    presidentCommunities,
    presidentCommunityIds: presidentCommunities.map((community) => community.id),
  }
}

export async function hasActiveOwnershipForUnit(
  session: Session,
  unitId: string,
  at = new Date(),
): Promise<boolean> {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return false
  }

  const ownership = await getActiveOwnershipForUnitDb(
    session.linkedOwnerId,
    unitId,
    buildActiveDateRangeFilter(at),
    session.officeId,
  )

  return Boolean(ownership)
}

export async function hasActiveOwnershipForCommunity(
  session: Session,
  communityId: string,
  at = new Date(),
): Promise<boolean> {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return false
  }

  const ownership = await getActiveOwnershipForCommunityDb(
    session.linkedOwnerId,
    communityId,
    buildActiveDateRangeFilter(at),
    session.officeId,
  )

  return Boolean(ownership)
}

export async function isActivePresidentForCommunity(
  session: Session,
  communityId: string,
  at = new Date(),
): Promise<boolean> {
  if (session.role !== 'PRESIDENT' || !session.linkedOwnerId) {
    return false
  }

  const position = await getActivePresidentPositionDb(
    communityId,
    session.linkedOwnerId,
    buildActiveDateRangeFilter(at),
    session.officeId,
  )

  return Boolean(position)
}

export async function canReadPortalCommunitySummary(
  session: Session,
  communityId: string,
  at = new Date(),
): Promise<boolean> {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return false
  }

  if (await hasActiveOwnershipForCommunity(session, communityId, at)) {
    return true
  }

  if (session.role !== 'PRESIDENT') {
    return false
  }

  return isActivePresidentForCommunity(session, communityId, at)
}

export async function canAccessPortalReceiptRecord(
  session: Session,
  receipt: PortalReceiptAccessRecord,
): Promise<boolean> {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return false
  }

  if (receipt.community?.officeId && receipt.community.officeId !== session.officeId) {
    return false
  }

  return receipt.ownerId === session.linkedOwnerId
}

export async function canReadPortalReceipt(
  session: Session,
  receiptId: string,
): Promise<boolean> {
  const receipt = await getReceiptAccessInfoDb(receiptId)

  if (!receipt) {
    return false
  }

  return canAccessPortalReceiptRecord(session, receipt)
}

export async function canAccessPortalIncidentRecord(
  session: Session,
  incident: PortalIncidentAccessRecord,
  at = new Date(),
): Promise<boolean> {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return false
  }

  if (incident.community?.officeId && incident.community.officeId !== session.officeId) {
    return false
  }

  if (session.role === 'PRESIDENT' && (await isActivePresidentForCommunity(session, incident.communityId, at))) {
    return true
  }

  if (!incident.unitId) {
    return false
  }

  return hasActiveOwnershipForUnit(session, incident.unitId, at)
}

export async function canReadPortalIncident(
  session: Session,
  incidentId: string,
  at = new Date(),
): Promise<boolean> {
  const incident = await getIncidentAccessInfoDb(incidentId)

  if (!incident) {
    return false
  }

  return canAccessPortalIncidentRecord(session, incident, at)
}

export async function canCreatePortalIncident(
  session: Session,
  input: { communityId: string; unitId?: string | null },
  at = new Date(),
): Promise<boolean> {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return false
  }

  const communityInScope = await canReadPortalCommunitySummary(session, input.communityId, at)

  if (!communityInScope) {
    return false
  }

  if (input.unitId) {
    return hasActiveOwnershipForUnit(session, input.unitId, at)
  }

  if (session.role !== 'PRESIDENT') {
    return false
  }

  return isActivePresidentForCommunity(session, input.communityId, at)
}
