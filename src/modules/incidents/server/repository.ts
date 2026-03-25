import 'server-only'

import { prisma } from '@/lib/db'
import {
    IncidentPriority,
    IncidentStatus,
    Prisma,
} from '@prisma/client'

export interface IncidentListFilters {
    search?: string
    communityId?: string
    providerId?: string
    status?: IncidentStatus
    priority?: IncidentPriority
    createdByUserId?: string
    overdue?: boolean
    openOnly?: boolean
    closedOnly?: boolean
}

export interface PaginationInput {
    page?: number
    pageSize?: number
}

function normalizePagination(input: PaginationInput = {}) {
    const rawPage = Number(input.page ?? 1)
    const rawPageSize = Number(input.pageSize ?? 20)

    const page = Number.isFinite(rawPage) ? Math.trunc(rawPage) : 1
    const pageSize = Number.isFinite(rawPageSize) ? Math.trunc(rawPageSize) : 20

    return {
        page: Math.max(1, page),
        pageSize: Math.min(100, Math.max(1, pageSize)),
    }
}

function buildIncidentWhere(
    officeId: string,
    filters: IncidentListFilters = {},
): Prisma.IncidentWhereInput {
    const where: Prisma.IncidentWhereInput = {
        community: { officeId },
    }

    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
        ]
    }

    if (filters.communityId) {
        where.communityId = filters.communityId
    }

    if (filters.providerId) {
        where.assignedProviderId = filters.providerId
    }

    if (filters.priority) {
        where.priority = filters.priority
    }

    if (filters.createdByUserId) {
        where.createdByUserId = filters.createdByUserId
    }

    if (filters.status) {
        where.status = filters.status
    } else if (filters.openOnly) {
        where.status = { notIn: ['RESOLVED', 'CLOSED'] }
    } else if (filters.closedOnly) {
        where.status = { in: ['RESOLVED', 'CLOSED'] }
    }

    if (filters.overdue) {
        where.dueAt = { lt: new Date() }
        where.NOT = [{ status: { in: ['RESOLVED', 'CLOSED'] } }]
    }

    return where
}

const incidentListInclude = {
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
            email: true,
        },
    },
    assignedProvider: {
        select: {
            id: true,
            name: true,
            category: true,
            archivedAt: true,
        },
    },
} satisfies Prisma.IncidentInclude

export async function findIncidentPageByOffice(
    officeId: string,
    filters: IncidentListFilters = {},
    pagination: PaginationInput = {},
) {
    const { page: requestedPage, pageSize } = normalizePagination(pagination)
    const where = buildIncidentWhere(officeId, filters)

    const total = await prisma.incident.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(requestedPage, totalPages)

    const items = await prisma.incident.findMany({
        where,
        include: incidentListInclude,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
    })

    return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
    }
}

export async function findIncidentByIdForOffice(
    incidentId: string,
    officeId: string,
) {
    return prisma.incident.findFirst({
        where: {
            id: incidentId,
            community: { officeId },
        },
        include: {
            community: true,
            unit: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            assignedProvider: true,
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
}

export async function createIncidentRecord(
    data: Prisma.IncidentUncheckedCreateInput,
) {
    return prisma.incident.create({
        data,
        include: incidentListInclude,
    })
}

export async function updateIncidentRecord(
    incidentId: string,
    data: Prisma.IncidentUncheckedUpdateInput,
) {
    return prisma.incident.update({
        where: { id: incidentId },
        data,
        include: incidentListInclude,
    })
}

export async function createIncidentCommentRecord(
    data: Prisma.IncidentCommentUncheckedCreateInput,
) {
    return prisma.incidentComment.create({
        data,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    })
}

export async function listIncidentTimelineRecords(
    officeId: string,
    incidentId: string,
) {
    const [auditLogs, comments] = await Promise.all([
        prisma.auditLog.findMany({
            where: {
                officeId,
                entityType: 'INCIDENT',
                entityId: incidentId,
            },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.incidentComment.findMany({
            where: {
                incidentId,
                incident: {
                    community: { officeId },
                },
            },
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
        }),
    ])

    const actorIds = Array.from(new Set(auditLogs.map((entry) => entry.userId).filter(Boolean)))

    const actors = actorIds.length
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: {
                id: true,
                name: true,
                email: true,
            },
        })
        : []

    const actorById = new Map(actors.map((actor) => [actor.id, actor]))

    const timeline = [
        ...auditLogs.map((entry) => ({
            id: entry.id,
            kind: 'AUDIT' as const,
            occurredAt: entry.createdAt,
            actor: actorById.get(entry.userId) ?? null,
            action: entry.action,
            meta: entry.metaJson ? JSON.parse(entry.metaJson) as Record<string, unknown> : null,
        })),
        ...comments.map((comment) => ({
            id: comment.id,
            kind: 'COMMENT' as const,
            occurredAt: comment.createdAt,
            actor: comment.author,
            visibility: comment.visibility,
            body: comment.body,
            action: 'CREATE' as const,
            meta: null,
        })),
    ]

    timeline.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())

    return timeline
}

export async function getIncidentDashboardSnapshotForOffice(officeId: string) {
    const [openCount, urgentCount, overdueCount, latestActive] = await Promise.all([
        prisma.incident.count({
            where: {
                community: { officeId },
                status: { notIn: ['RESOLVED', 'CLOSED'] },
            },
        }),
        prisma.incident.count({
            where: {
                community: { officeId },
                status: { notIn: ['RESOLVED', 'CLOSED'] },
                priority: 'URGENT',
            },
        }),
        prisma.incident.count({
            where: {
                community: { officeId },
                status: { notIn: ['RESOLVED', 'CLOSED'] },
                dueAt: { lt: new Date() },
            },
        }),
        prisma.incident.findMany({
            where: {
                community: { officeId },
                status: { notIn: ['RESOLVED', 'CLOSED'] },
            },
            include: incidentListInclude,
            orderBy: { updatedAt: 'desc' },
            take: 8,
        }),
    ])

    const activeIncidentsByProvider = await prisma.incident.findMany({
        where: {
            community: { officeId },
            status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
        select: {
            assignedProviderId: true,
            assignedProvider: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    })

    const providerCounts = new Map<string, { providerId: string | null; providerName: string; count: number }>()

    for (const row of activeIncidentsByProvider) {
        const key = row.assignedProviderId ?? 'unassigned'
        const current = providerCounts.get(key)

        if (current) {
            current.count += 1
            continue
        }

        providerCounts.set(key, {
            providerId: row.assignedProviderId,
            providerName: row.assignedProvider?.name ?? 'Sin proveedor',
            count: 1,
        })
    }

    return {
        openCount,
        urgentCount,
        overdueCount,
        incidentsByProvider: Array.from(providerCounts.values()).sort(
            (left, right) => right.count - left.count,
        ),
        latestActive,
    }
}
