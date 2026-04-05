import 'server-only'

import { prisma } from '@/lib/db'
import type { AuditAction } from '@prisma/client'
import { requireAuth } from '@/lib/auth'
import { canReadAudit } from '@/lib/permissions'

/**
 * Audit page auth aggregator — resolves auth + canReadAudit.
 */
export async function getAuditPageQuery() {
  const session = await requireAuth()
  if (!canReadAudit(session)) {
    throw new Error('FORBIDDEN')
  }
  return { session }
}


export interface ListAuditParams {
  officeId: string
  action?: AuditAction
  entityType?: string
  userId?: string
  page?: number
  pageSize?: number
}

export async function listAuditLogs(params: ListAuditParams) {
  const { officeId, action, entityType, userId, page = 1, pageSize = 30 } = params

  const where = {
    officeId,
    ...(action && { action }),
    ...(entityType && { entityType }),
    ...(userId && { userId }),
  }

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  // Get user details for these logs
  const userIds = Array.from(new Set(items.map((i) => i.userId)))
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user
    return acc
  }, {} as Record<string, { id: string; name: string; email: string }>)

  const enrichedItems = items.map((item) => ({
    ...item,
    user: userMap[item.userId] || { name: 'Usuario Desconocido', email: '' },
  }))

  return {
    items: enrichedItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getAuditEntityTypes(officeId: string) {
  // Query distinct entity types generated in this office
  const types = await prisma.auditLog.findMany({
    where: { officeId },
    select: { entityType: true },
    distinct: ['entityType'],
  })
  return types.map(t => t.entityType).sort()
}
