import 'server-only'

import type { DocumentVisibility, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type DocumentListFilters = {
  search?: string
  communityId?: string
  visibility?: DocumentVisibility
  category?: string
  archived?: boolean
}

export type PaginationInput = {
  page?: number
  pageSize?: number
}

function normalizePagination(input: PaginationInput = {}) {
  const rawPage = Number(input.page ?? 1)
  const rawPageSize = Number(input.pageSize ?? 20)

  return {
    page: Math.max(1, Math.trunc(Number.isFinite(rawPage) ? rawPage : 1)),
    pageSize: Math.min(100, Math.max(1, Math.trunc(Number.isFinite(rawPageSize) ? rawPageSize : 20))),
  }
}

function buildDocumentWhere(officeId: string, filters: DocumentListFilters = {}): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {
    community: {
      officeId,
      archivedAt: null,
    },
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
      { community: { name: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  if (filters.communityId) where.communityId = filters.communityId
  if (filters.visibility) where.visibility = filters.visibility
  if (filters.category) where.category = filters.category
  if (filters.archived === true) where.archivedAt = { not: null }
  if (filters.archived === false) where.archivedAt = null

  return where
}

export async function listDocumentsPageByOffice(
  officeId: string,
  filters: DocumentListFilters = {},
  pagination: PaginationInput = {},
) {
  const { page: requestedPage, pageSize } = normalizePagination(pagination)
  const where = buildDocumentWhere(officeId, filters)

  const total = await prisma.document.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const skip = (page - 1) * pageSize

  const items = await prisma.document.findMany({
    where,
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    skip,
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

export async function findDocumentByIdForOffice(documentId: string, officeId: string) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      community: {
        officeId,
        archivedAt: null,
      },
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })
}

export async function listDocumentCommunitiesByOffice(officeId: string) {
  return prisma.community.findMany({
    where: {
      officeId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: [{ name: 'asc' }],
  })
}

export async function listDocumentCategoriesByOffice(officeId: string) {
  const categories = await prisma.document.findMany({
    where: {
      community: {
        officeId,
        archivedAt: null,
      },
      category: {
        not: null,
      },
    },
    select: {
      category: true,
    },
    distinct: ['category'],
    orderBy: [{ category: 'asc' }],
  })

  return categories.map((item) => item.category).filter((value): value is string => Boolean(value))
}
