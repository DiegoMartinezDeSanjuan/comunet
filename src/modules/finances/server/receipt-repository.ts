import 'server-only'

import { prisma } from '@/lib/db'
import { Prisma, ReceiptStatus } from '@prisma/client'

export type ReceiptFilters = {
  communityId?: string
  status?: ReceiptStatus | string
  unitId?: string
  ownerId?: string
  periodStart?: string
  periodEnd?: string
}

type ReceiptPaginationInput = {
  page?: number
  pageSize?: number
}

/** Select clause for receipt list views — only fields consumed by the UI */
const receiptListSelect = {
  id: true,
  reference: true,
  amount: true,
  paidAmount: true,
  status: true,
  issueDate: true,
  dueDate: true,
  periodStart: true,
  periodEnd: true,
  communityId: true,
  unitId: true,
  ownerId: true,
  createdAt: true,
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
  owner: {
    select: {
      id: true,
      fullName: true,
    },
  },
} satisfies Prisma.ReceiptSelect

function buildReceiptWhereForCommunity(
  communityId: string,
  filters: ReceiptFilters = {},
): Prisma.ReceiptWhereInput {
  const where: Prisma.ReceiptWhereInput = { communityId }

  if (filters.status) where.status = filters.status as ReceiptStatus
  if (filters.unitId) where.unitId = filters.unitId
  if (filters.ownerId) where.ownerId = filters.ownerId

  if (filters.periodStart && filters.periodEnd) {
    where.periodStart = { gte: new Date(filters.periodStart) }
    where.periodEnd = { lte: new Date(filters.periodEnd) }
  }

  return where
}

function buildReceiptWhereForOffice(
  officeId: string,
  filters: ReceiptFilters = {},
): Prisma.ReceiptWhereInput {
  const where: Prisma.ReceiptWhereInput = { community: { officeId } }

  if (filters.communityId) where.communityId = filters.communityId
  if (filters.status) where.status = filters.status as ReceiptStatus
  if (filters.unitId) where.unitId = filters.unitId
  if (filters.ownerId) where.ownerId = filters.ownerId

  if (filters.periodStart && filters.periodEnd) {
    where.periodStart = { gte: new Date(filters.periodStart) }
    where.periodEnd = { lte: new Date(filters.periodEnd) }
  }

  return where
}

function normalizePagination(input: ReceiptPaginationInput = {}) {
  const rawPage = Number(input.page ?? 1)
  const rawPageSize = Number(input.pageSize ?? 20)

  return {
    page: Math.max(1, Math.trunc(Number.isFinite(rawPage) ? rawPage : 1)),
    pageSize: Math.min(100, Math.max(1, Math.trunc(Number.isFinite(rawPageSize) ? rawPageSize : 20))),
  }
}

export async function findReceiptsByCommunity(
  communityId: string,
  filters: ReceiptFilters = {},
) {
  const where = buildReceiptWhereForCommunity(communityId, filters)

  return prisma.receipt.findMany({
    where,
    select: receiptListSelect,
    orderBy: { dueDate: 'desc' },
  })
}

export async function findReceiptsByOffice(
  officeId: string,
  filters: ReceiptFilters = {},
) {
  const where = buildReceiptWhereForOffice(officeId, filters)

  return prisma.receipt.findMany({
    where,
    select: receiptListSelect,
    orderBy: { dueDate: 'desc' },
  })
}

export async function findReceiptsPageByOffice(
  officeId: string,
  filters: ReceiptFilters = {},
  pagination: ReceiptPaginationInput = {},
) {
  const { page: requestedPage, pageSize } = normalizePagination(pagination)
  const where = buildReceiptWhereForOffice(officeId, filters)

  const total = await prisma.receipt.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const skip = (page - 1) * pageSize

  const items = await prisma.receipt.findMany({
    where,
    select: receiptListSelect,
    orderBy: { dueDate: 'desc' },
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

export async function findReceiptById(id: string) {
  return prisma.receipt.findUnique({
    where: { id },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          cif: true,
          officeId: true,
        },
      },
      unit: {
        select: {
          id: true,
          reference: true,
          type: true,
        },
      },
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      payments: { orderBy: { paymentDate: 'desc' } },
      debts: true,
    },
  })
}

export async function getExistingReceiptsForPeriod(
  communityId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  return prisma.receipt.findMany({
    where: {
      communityId,
      periodStart,
      periodEnd,
    },
    select: { unitId: true },
  })
}

export async function markReceiptStatus(id: string, status: ReceiptStatus) {
  return prisma.receipt.update({
    where: { id },
    data: { status },
  })
}
