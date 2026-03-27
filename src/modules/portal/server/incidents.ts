import 'server-only'

import type { IncidentPriority, IncidentStatus, Prisma } from '@prisma/client'

import type { Session } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  addIncidentComment,
  createIncident,
} from '@/modules/incidents/server/services'

import {
  canAccessPortalIncidentRecord,
  canCreatePortalIncident,
  canReadPortalIncident,
  filterPortalVisibleComments,
  getPortalAccessScope,
  isPortalOwnerPresidentRole,
} from './policy'

export interface PortalIncidentFilters {
  communityId?: string
  status?: IncidentStatus | string
  priority?: IncidentPriority | string
  search?: string
}

export interface CreatePortalIncidentInput {
  communityId: string
  unitId?: string | null
  title: string
  description?: string | null
  priority?: IncidentPriority
  dueAt?: string | null
}

const ALLOWED_INCIDENT_STATUSES = new Set<IncidentStatus>([
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_VENDOR',
  'RESOLVED',
  'CLOSED',
])

const ALLOWED_INCIDENT_PRIORITIES = new Set<IncidentPriority>([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
])

function normalizePortalIncidentFilters(filters: PortalIncidentFilters = {}): PortalIncidentFilters {
  const status =
    typeof filters.status === 'string' && ALLOWED_INCIDENT_STATUSES.has(filters.status as IncidentStatus)
      ? (filters.status as IncidentStatus)
      : undefined

  const priority =
    typeof filters.priority === 'string' && ALLOWED_INCIDENT_PRIORITIES.has(filters.priority as IncidentPriority)
      ? (filters.priority as IncidentPriority)
      : undefined

  return {
    communityId: typeof filters.communityId === 'string' ? filters.communityId : undefined,
    status,
    priority,
    search: typeof filters.search === 'string' ? filters.search.trim() : undefined,
  }
}

export async function listPortalIncidentComposerOptions(session: Session) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return {
      units: [],
      communities: [],
    }
  }

  const scope = await getPortalAccessScope(session)
  const communitiesMap = new Map<string, { id: string; name: string; canCreateCommunityIncident: boolean }>()

  for (const community of scope.ownedCommunities) {
    communitiesMap.set(community.id, {
      id: community.id,
      name: community.name,
      canCreateCommunityIncident: false,
    })
  }

  for (const community of scope.presidentCommunities) {
    communitiesMap.set(community.id, {
      id: community.id,
      name: community.name,
      canCreateCommunityIncident: true,
    })
  }

  return {
    units: scope.ownedUnits,
    communities: Array.from(communitiesMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name, 'es'),
    ),
  }
}

export async function listPortalIncidents(
  session: Session,
  filters: PortalIncidentFilters = {},
) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return {
      items: [],
      scope: null,
      composerOptions: {
        units: [],
        communities: [],
      },
      appliedFilters: normalizePortalIncidentFilters(filters),
    }
  }

  const scope = await getPortalAccessScope(session)
  const composerOptions = await listPortalIncidentComposerOptions(session)
  const appliedFilters = normalizePortalIncidentFilters(filters)
  const scopeConditions: Prisma.IncidentWhereInput[] = []

  if (scope.ownedUnitIds.length > 0) {
    scopeConditions.push({ unitId: { in: scope.ownedUnitIds } })
  }

  if (session.role === 'PRESIDENT' && scope.presidentCommunityIds.length > 0) {
    scopeConditions.push({ communityId: { in: scope.presidentCommunityIds } })
  }

  if (!scopeConditions.length) {
    return {
      items: [],
      scope,
      composerOptions,
      appliedFilters,
    }
  }

  const accessibleCommunityIds = new Set([
    ...scope.ownedCommunityIds,
    ...scope.presidentCommunityIds,
  ])

  const andConditions: Prisma.IncidentWhereInput[] = [
    { community: { officeId: session.officeId } },
    { OR: scopeConditions },
  ]

  if (appliedFilters.communityId && accessibleCommunityIds.has(appliedFilters.communityId)) {
    andConditions.push({ communityId: appliedFilters.communityId })
  }

  if (appliedFilters.status) {
    andConditions.push({ status: appliedFilters.status })
  }

  if (appliedFilters.priority) {
    andConditions.push({ priority: appliedFilters.priority })
  }

  if (appliedFilters.search) {
    andConditions.push({
      OR: [
        { title: { contains: appliedFilters.search, mode: 'insensitive' } },
        { description: { contains: appliedFilters.search, mode: 'insensitive' } },
      ],
    })
  }

  const items = await prisma.incident.findMany({
    where: { AND: andConditions },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      unit: {
        select: {
          id: true,
          reference: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedProvider: {
        select: {
          id: true,
          name: true,
        },
      },
      comments: {
        select: {
          id: true,
          visibility: true,
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  return {
    items: items.map((incident) => ({
      ...incident,
      sharedCommentCount: filterPortalVisibleComments(incident.comments).length,
    })),
    scope,
    composerOptions,
    appliedFilters,
  }
}

export async function getPortalIncidentDetail(session: Session, incidentId: string) {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          officeId: true,
        },
      },
      unit: {
        select: {
          id: true,
          reference: true,
          floor: true,
          door: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedProvider: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!incident) {
    return null
  }

  const allowed = await canAccessPortalIncidentRecord(session, incident)

  if (!allowed) {
    return null
  }

  return {
    ...incident,
    comments: filterPortalVisibleComments(incident.comments),
  }
}

export async function createPortalIncident(
  session: Session,
  input: CreatePortalIncidentInput,
) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    throw new Error('FORBIDDEN')
  }

  const allowed = await canCreatePortalIncident(session, {
    communityId: input.communityId,
    unitId: input.unitId ?? null,
  })

  if (!allowed) {
    throw new Error('FORBIDDEN')
  }

  return createIncident(session.officeId, session.userId, {
    communityId: input.communityId,
    unitId: input.unitId ?? null,
    assignedProviderId: null,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'MEDIUM',
    dueAt: input.dueAt ?? null,
  })
}

export async function addPortalIncidentSharedComment(
  session: Session,
  input: { incidentId: string; body: string },
) {
  const allowed = await canReadPortalIncident(session, input.incidentId)

  if (!allowed) {
    throw new Error('FORBIDDEN')
  }

  return addIncidentComment(session.officeId, session.userId, {
    incidentId: input.incidentId,
    body: input.body,
    visibility: 'SHARED',
  })
}
