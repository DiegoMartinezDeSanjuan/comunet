import 'server-only'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function findReceiptsByCommunity(communityId: string, filters: any = {}) {
  const where: Prisma.ReceiptWhereInput = { communityId }
  
  if (filters.status) where.status = filters.status
  if (filters.unitId) where.unitId = filters.unitId
  if (filters.ownerId) where.ownerId = filters.ownerId
  if (filters.periodStart && filters.periodEnd) {
    where.periodStart = { gte: new Date(filters.periodStart) }
    where.periodEnd = { lte: new Date(filters.periodEnd) }
  }

  return prisma.receipt.findMany({
    where,
    include: {
      unit: true,
      owner: true,
    },
  })
}

export async function findReceiptsByOffice(officeId: string, filters: any = {}) {
  const where: Prisma.ReceiptWhereInput = { community: { officeId } }
  
  if (filters.communityId) where.communityId = filters.communityId
  if (filters.status) where.status = filters.status
  if (filters.unitId) where.unitId = filters.unitId
  if (filters.ownerId) where.ownerId = filters.ownerId
  if (filters.periodStart && filters.periodEnd) {
    where.periodStart = { gte: new Date(filters.periodStart) }
    where.periodEnd = { lte: new Date(filters.periodEnd) }
  }

  return prisma.receipt.findMany({
    where,
    include: {
      community: true,
      unit: true,
      owner: true,
    },
    orderBy: { dueDate: 'desc' }
  })
}

export async function findReceiptById(id: string) {
  return prisma.receipt.findUnique({
    where: { id },
    include: {
      community: true,
      unit: true,
      owner: true,
      payments: { orderBy: { paymentDate: 'desc' } },
      debts: true
    }
  })
}

export async function getExistingReceiptsForPeriod(communityId: string, periodStart: Date, periodEnd: Date) {
  return prisma.receipt.findMany({
    where: {
      communityId,
      periodStart,
      periodEnd
    },
    select: { unitId: true }
  })
}

export async function markReceiptStatus(id: string, status: any) {
  return prisma.receipt.update({
    where: { id },
    data: { status }
  })
}
