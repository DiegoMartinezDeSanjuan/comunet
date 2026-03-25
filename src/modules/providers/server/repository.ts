import 'server-only'

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface ProviderListFilters {
    search?: string
    category?: string
    archived?: boolean
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

function buildProviderWhere(
    officeId: string,
    filters: ProviderListFilters = {},
): Prisma.ProviderWhereInput {
    const where: Prisma.ProviderWhereInput = {
        officeId,
    }

    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { phone: { contains: filters.search, mode: 'insensitive' } },
            { cif: { contains: filters.search, mode: 'insensitive' } },
        ]
    }

    if (filters.category) {
        where.category = filters.category
    }

    if (filters.archived === true) {
        where.archivedAt = { not: null }
    }

    if (filters.archived === false) {
        where.archivedAt = null
    }

    return where
}

export async function listProvidersPageByOffice(
    officeId: string,
    filters: ProviderListFilters = {},
    pagination: PaginationInput = {},
) {
    const { page: requestedPage, pageSize } = normalizePagination(pagination)
    const where = buildProviderWhere(officeId, filters)

    const total = await prisma.provider.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(requestedPage, totalPages)

    const items = await prisma.provider.findMany({
        where,
        orderBy: [{ archivedAt: 'asc' }, { name: 'asc' }],
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

export async function findProviderByIdForOffice(
    providerId: string,
    officeId: string,
) {
    const provider = await prisma.provider.findFirst({
        where: {
            id: providerId,
            officeId,
        },
    })

    if (!provider) {
        return null
    }

    const [activeIncidents, closedIncidents] = await Promise.all([
        prisma.incident.findMany({
            where: {
                assignedProviderId: providerId,
                community: { officeId },
                status: { notIn: ['RESOLVED', 'CLOSED'] },
            },
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
            },
            orderBy: { updatedAt: 'desc' },
            take: 15,
        }),
        prisma.incident.findMany({
            where: {
                assignedProviderId: providerId,
                community: { officeId },
                status: { in: ['RESOLVED', 'CLOSED'] },
            },
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
            },
            orderBy: { updatedAt: 'desc' },
            take: 15,
        }),
    ])

    const lastActivityAt = [
        provider.updatedAt,
        ...activeIncidents.map((incident) => incident.updatedAt),
        ...closedIncidents.map((incident) => incident.updatedAt),
    ].sort((left, right) => right.getTime() - left.getTime())[0] ?? null

    return {
        provider,
        activeIncidents,
        closedIncidents,
        activeCount: activeIncidents.length,
        closedCount: closedIncidents.length,
        lastActivityAt,
    }
}

export async function createProviderRecord(
    data: Prisma.ProviderUncheckedCreateInput,
) {
    return prisma.provider.create({ data })
}

export async function updateProviderRecord(
    providerId: string,
    data: Prisma.ProviderUncheckedUpdateInput,
) {
    return prisma.provider.update({
        where: { id: providerId },
        data,
    })
}
