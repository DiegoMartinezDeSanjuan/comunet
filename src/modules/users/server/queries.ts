import 'server-only'

import { prisma } from '@/lib/db'
import type { UserStatus, UserRole } from '@prisma/client'

export interface ListUsersParams {
  officeId: string
  search?: string
  role?: UserRole
  status?: UserStatus
  page?: number
  pageSize?: number
}

export async function listUsers(params: ListUsersParams) {
  const { officeId, search, role, status, page = 1, pageSize = 20 } = params

  const where = {
    officeId,
    archivedAt: null,
    ...(role && { role }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        linkedOwner: { select: { id: true, fullName: true, dni: true } },
        linkedProvider: { select: { id: true, name: true, category: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
