import 'server-only'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function findCommunitiesByOffice(officeId: string, search?: string) {
  const where: Prisma.CommunityWhereInput = {
    officeId,
    archivedAt: null,
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { cif: { contains: search, mode: 'insensitive' } },
    ]
  }

  return prisma.community.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { units: true }
      }
    }
  })
}

export async function findCommunityById(id: string, officeId: string) {
  return prisma.community.findFirst({
    where: { id, officeId, archivedAt: null },
    include: {
      buildings: true,
      boardPositions: { include: { owner: true } },
      _count: {
        select: {
          units: true,
        }
      }
    }
  })
}

export async function createCommunity(officeId: string, data: Omit<Prisma.CommunityUncheckedCreateInput, 'id' | 'officeId' | 'createdAt' | 'updatedAt' | 'archivedAt'>) {
  return prisma.community.create({
    data: {
      ...data,
      officeId,
    },
  })
}

export async function updateCommunity(id: string, officeId: string, data: Omit<Prisma.CommunityUncheckedUpdateInput, 'id' | 'officeId' | 'createdAt' | 'updatedAt' | 'archivedAt'>) {
  const existing = await prisma.community.findFirst({ where: { id, officeId, archivedAt: null } })
  if (!existing) throw new Error("Community not found or access denied")
  
  return prisma.community.update({
    where: { id },
    data,
  })
}

export async function archiveCommunity(id: string, officeId: string) {
  const existing = await prisma.community.findFirst({ where: { id, officeId, archivedAt: null } })
  if (!existing) throw new Error("Community not found or access denied")

  return prisma.community.update({
    where: { id },
    data: { archivedAt: new Date() },
  })
}
