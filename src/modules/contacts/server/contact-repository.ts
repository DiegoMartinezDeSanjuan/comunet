import 'server-only'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// --- Owners ---
export async function findOwnersByOffice(officeId: string, search?: string) {
  const where: Prisma.OwnerWhereInput = { officeId, archivedAt: null }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { dni: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  return prisma.owner.findMany({ where, orderBy: { fullName: 'asc' } })
}

export async function findOwnerById(id: string, officeId: string) {
  return prisma.owner.findFirst({
    where: { id, officeId, archivedAt: null },
    include: {
      ownerships: { include: { unit: { include: { building: true, community: true } } } },
      boardPositions: { include: { community: true } }
    }
  })
}

export async function createOwner(data: Prisma.OwnerUncheckedCreateInput) {
  return prisma.owner.create({ data })
}

export async function updateOwner(id: string, officeId: string, data: Prisma.OwnerUncheckedUpdateInput) {
  const exist = await prisma.owner.findFirst({ where: { id, officeId } })
  if (!exist) throw new Error('Owner not found')
  return prisma.owner.update({ where: { id }, data })
}

// --- Tenants ---
export async function findTenantsByOffice(officeId: string, search?: string) {
  const where: Prisma.TenantWhereInput = { officeId, archivedAt: null }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { dni: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  return prisma.tenant.findMany({ where, orderBy: { fullName: 'asc' } })
}

export async function findTenantById(id: string, officeId: string) {
  return prisma.tenant.findFirst({
    where: { id, officeId, archivedAt: null },
  })
}

export async function createTenant(data: Prisma.TenantUncheckedCreateInput) {
  return prisma.tenant.create({ data })
}

export async function updateTenant(id: string, officeId: string, data: Prisma.TenantUncheckedUpdateInput) {
  const exist = await prisma.tenant.findFirst({ where: { id, officeId } })
  if (!exist) throw new Error('Tenant not found')
  return prisma.tenant.update({ where: { id }, data })
}

// --- Associations ---
export async function createOwnership(data: Prisma.OwnershipUncheckedCreateInput) {
  return prisma.ownership.create({ data })
}

export async function createBoardPosition(data: Prisma.BoardPositionUncheckedCreateInput) {
  return prisma.boardPosition.create({ data })
}
