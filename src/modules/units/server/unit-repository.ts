import 'server-only'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function findBuildingsByCommunity(communityId: string) {
  return prisma.building.findMany({
    where: { communityId },
    orderBy: { name: 'asc' },
  })
}

export async function findUnitsByCommunity(communityId: string) {
  return prisma.unit.findMany({
    where: { communityId, active: true },
    include: { building: true, ownerships: { include: { owner: true } } },
    orderBy: [{ buildingId: 'asc' }, { reference: 'asc' }],
  })
}

export async function createBuilding(data: Prisma.BuildingUncheckedCreateInput) {
  return prisma.building.create({ data })
}

export async function createUnit(data: Prisma.UnitUncheckedCreateInput) {
  return prisma.unit.create({ data })
}

export async function updateUnit(id: string, data: Prisma.UnitUncheckedUpdateInput) {
  return prisma.unit.update({
    where: { id },
    data,
  })
}

export async function archiveUnit(id: string) {
  return prisma.unit.update({
    where: { id },
    data: { active: false },
  })
}
