import 'server-only'

import { prisma } from '@/lib/db'
import {
    NotificationChannel,
    NotificationStatus,
    Prisma,
    UserRole,
} from '@prisma/client'

export interface CreateNotificationRecordInput {
    officeId: string
    communityId?: string | null
    recipientUserId?: string | null
    channel?: NotificationChannel
    title: string
    body?: string | null
    status?: NotificationStatus
    sentAt?: Date | null
}

export interface NotificationListFilters {
    status?: NotificationStatus
    channel?: NotificationChannel
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

export async function createNotificationRecord(
    input: CreateNotificationRecordInput,
) {
    return prisma.notification.create({
        data: {
            officeId: input.officeId,
            communityId: input.communityId ?? null,
            recipientUserId: input.recipientUserId ?? null,
            channel: input.channel ?? 'IN_APP',
            title: input.title,
            body: input.body ?? null,
            status: input.status ?? 'SENT',
            sentAt: input.sentAt ?? new Date(),
        },
    })
}

export async function listNotificationPageForUser(
    officeId: string,
    userId: string,
    filters: NotificationListFilters = {},
    pagination: PaginationInput = {},
) {
    const { page: requestedPage, pageSize } = normalizePagination(pagination)

    const where: Prisma.NotificationWhereInput = {
        officeId,
        recipientUserId: userId,
    }

    if (filters.status) {
        where.status = filters.status
    }

    if (filters.channel) {
        where.channel = filters.channel
    }

    const total = await prisma.notification.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(requestedPage, totalPages)

    const items = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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

export async function markNotificationReadRecord(
    officeId: string,
    userId: string,
    notificationId: string,
) {
    return prisma.notification.updateMany({
        where: {
            id: notificationId,
            officeId,
            recipientUserId: userId,
        },
        data: {
            status: 'READ',
            sentAt: new Date(),
        },
    })
}

export async function listActiveUsersByRoles(
    officeId: string,
    roles: UserRole[],
) {
    return prisma.user.findMany({
        where: {
            officeId,
            role: { in: roles },
            status: 'ACTIVE',
            archivedAt: null,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    })
}

export async function listLinkedUsersForProvider(
    officeId: string,
    providerId: string,
) {
    return prisma.user.findMany({
        where: {
            officeId,
            linkedProviderId: providerId,
            status: 'ACTIVE',
            archivedAt: null,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    })
}
