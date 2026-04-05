import 'server-only'

import type { IncidentPriority, IncidentStatus, Prisma } from '@prisma/client'

import { requireAuth, type Session } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/modules/audit/server/services'
import { addIncidentComment } from '@/modules/incidents/server/services'
import { filterPortalVisibleComments, isPortalProviderRole } from './policy'

// ─── Provider Status Transitions ─────────────────────────

const PROVIDER_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: [],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_VENDOR', 'RESOLVED'],
  WAITING_VENDOR: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: [],
  CLOSED: [],
}

export function getProviderAllowedTransitions(currentStatus: IncidentStatus): IncidentStatus[] {
  return PROVIDER_STATUS_TRANSITIONS[currentStatus] ?? []
}

export function canProviderTransitionStatus(
  currentStatus: IncidentStatus,
  nextStatus: IncidentStatus,
): boolean {
  if (currentStatus === nextStatus) return false
  return PROVIDER_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false
}

// ─── Provider Scope ──────────────────────────────────────

function assertProviderSession(session: Session): asserts session is Session & { linkedProviderId: string } {
  if (!isPortalProviderRole(session.role) || !session.linkedProviderId) {
    throw new Error('FORBIDDEN')
  }
}

// ─── Provider Dashboard ──────────────────────────────────

export async function getProviderDashboardData() {
  const session = await requireAuth()
  assertProviderSession(session)

  const where: Prisma.IncidentWhereInput = {
    assignedProviderId: session.linkedProviderId,
    community: { officeId: session.officeId },
  }

  const [totalAssigned, inProgressCount, resolvedCount, recentIncidents] = await Promise.all([
    prisma.incident.count({ where: { ...where, status: { notIn: ['CLOSED'] } } }),
    prisma.incident.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.incident.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.incident.findMany({
      where,
      include: {
        community: { select: { id: true, name: true } },
        unit: { select: { id: true, reference: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 8,
    }),
  ])

  return {
    kpis: {
      totalAssigned,
      inProgressCount,
      resolvedCount,
    },
    recentIncidents,
    session,
  }
}

// ─── Provider Incidents List ─────────────────────────────

export interface ProviderIncidentFilters {
  communityId?: string
  status?: string
  priority?: string
  search?: string
}

const ALLOWED_STATUSES = new Set<IncidentStatus>([
  'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_VENDOR', 'RESOLVED', 'CLOSED',
])
const ALLOWED_PRIORITIES = new Set<IncidentPriority>(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export async function listProviderIncidents(
  filters: ProviderIncidentFilters = {},
) {
  const session = await requireAuth()
  assertProviderSession(session)

  const andConditions: Prisma.IncidentWhereInput[] = [
    { assignedProviderId: session.linkedProviderId },
    { community: { officeId: session.officeId } },
  ]

  if (filters.communityId) {
    andConditions.push({ communityId: filters.communityId })
  }

  if (filters.status && ALLOWED_STATUSES.has(filters.status as IncidentStatus)) {
    andConditions.push({ status: filters.status as IncidentStatus })
  }

  if (filters.priority && ALLOWED_PRIORITIES.has(filters.priority as IncidentPriority)) {
    andConditions.push({ priority: filters.priority as IncidentPriority })
  }

  if (filters.search?.trim()) {
    andConditions.push({
      OR: [
        { title: { contains: filters.search.trim(), mode: 'insensitive' } },
        { description: { contains: filters.search.trim(), mode: 'insensitive' } },
      ],
    })
  }

  const items = await prisma.incident.findMany({
    where: { AND: andConditions },
    include: {
      community: { select: { id: true, name: true } },
      unit: { select: { id: true, reference: true } },
      comments: { select: { id: true, visibility: true } },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  // Get unique community list for filter dropdown
  const communityIds = [...new Set(items.map((i) => i.communityId))]
  const communities = await prisma.community.findMany({
    where: { id: { in: communityIds } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return {
    items: items.map((incident) => ({
      ...incident,
      sharedCommentCount: filterPortalVisibleComments(incident.comments).length,
    })),
    communities,
    appliedFilters: {
      communityId: filters.communityId,
      status: filters.status,
      priority: filters.priority,
      search: filters.search?.trim(),
    },
    session,
  }
}

// ─── Provider Incident Detail ────────────────────────────

export async function getProviderIncidentDetail(incidentId: string) {
  const session = await requireAuth()
  assertProviderSession(session)

  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      assignedProviderId: session.linkedProviderId,
      community: { officeId: session.officeId },
    },
    include: {
      community: { select: { id: true, name: true, address: true } },
      unit: { select: { id: true, reference: true, floor: true, door: true } },
      assignedProvider: { select: { id: true, name: true, category: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!incident) return null

  return {
    ...incident,
    comments: filterPortalVisibleComments(incident.comments),
    allowedTransitions: getProviderAllowedTransitions(incident.status),
    session,
  }
}

// ─── Provider Status Change ──────────────────────────────

export async function changeProviderIncidentStatus(
  incidentId: string,
  newStatus: IncidentStatus,
) {
  const session = await requireAuth()
  assertProviderSession(session)

  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      assignedProviderId: session.linkedProviderId,
      community: { officeId: session.officeId },
    },
  })

  if (!incident) {
    throw new Error('Incidencia no encontrada o fuera de tu alcance')
  }

  if (!canProviderTransitionStatus(incident.status, newStatus)) {
    throw new Error(`No puedes mover esta incidencia de ${incident.status} a ${newStatus}`)
  }

  const resolvedAt =
    newStatus === 'RESOLVED'
      ? incident.resolvedAt ?? new Date()
      : newStatus === 'IN_PROGRESS' || newStatus === 'WAITING_VENDOR'
        ? null
        : incident.resolvedAt

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: { status: newStatus, resolvedAt },
  })

  logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'INCIDENT',
    entityId: incidentId,
    action: 'STATUS_CHANGE',
    meta: {
      actor: 'PROVIDER',
      previousStatus: incident.status,
      nextStatus: newStatus,
    },
  })

  return updated
}

// ─── Provider Comment ────────────────────────────────────

export async function addProviderIncidentComment(
  incidentId: string,
  body: string,
) {
  const session = await requireAuth()
  assertProviderSession(session)

  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      assignedProviderId: session.linkedProviderId,
      community: { officeId: session.officeId },
    },
  })

  if (!incident) {
    throw new Error('No puedes comentar una incidencia fuera de tu alcance')
  }

  return addIncidentComment(session.officeId, session.userId, {
    incidentId,
    body,
    visibility: 'SHARED',
  })
}
