import 'server-only'
import * as repo from './unit-repository'
import { buildingSchema, unitSchema, type BuildingInput, type UnitInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { prisma } from '@/lib/db'

export async function getCommunityUnitsData(communityId: string) {
  const [buildings, units] = await Promise.all([
    repo.findBuildingsByCommunity(communityId),
    repo.findUnitsByCommunity(communityId),
  ])
  return { buildings, units }
}

export async function createBuildingService(officeId: string, userId: string, data: BuildingInput) {
  const valid = buildingSchema.parse(data)
  
  // verify community belongs to office
  const community = await prisma.community.findFirst({ where: { id: valid.communityId, officeId } })
  if (!community) throw new Error("Comunidad no encontrada")
    
  const building = await repo.createBuilding(valid)
  
  await logAudit({
    officeId,
    userId,
    entityType: 'Building',
    entityId: building.id,
    action: 'CREATE',
    meta: { name: building.name, communityId: valid.communityId }
  })
  
  return building
}

export async function createUnitService(officeId: string, userId: string, data: UnitInput) {
  const valid = unitSchema.parse(data)
  
  const community = await prisma.community.findFirst({ where: { id: valid.communityId, officeId } })
  if (!community) throw new Error("Comunidad no encontrada")
    
  const unit = await repo.createUnit({
    ...valid,
    areaM2: valid.areaM2 ?? undefined,
    coefficient: valid.coefficient ?? undefined,
    quotaPercent: valid.quotaPercent ?? undefined,
    buildingId: valid.buildingId ?? undefined,
    floor: valid.floor ?? undefined,
    door: valid.door ?? undefined,
  })
  
  await logAudit({
    officeId,
    userId,
    entityType: 'Unit',
    entityId: unit.id,
    action: 'CREATE',
    meta: { reference: unit.reference, communityId: valid.communityId }
  })
  
  return unit
}

export async function updateUnitService(id: string, officeId: string, userId: string, data: UnitInput) {
  const valid = unitSchema.parse(data)
  
  const unit = await repo.updateUnit(id, {
    ...valid,
    areaM2: valid.areaM2 ?? undefined,
    coefficient: valid.coefficient ?? undefined,
    quotaPercent: valid.quotaPercent ?? undefined,
    buildingId: valid.buildingId ?? undefined,
    floor: valid.floor ?? undefined,
    door: valid.door ?? undefined,
  })
  
  await logAudit({
    officeId,
    userId,
    entityType: 'Unit',
    entityId: unit.id,
    action: 'UPDATE',
    meta: { reference: unit.reference }
  })
  
  return unit
}

export async function archiveUnitService(id: string, officeId: string, userId: string) {
  const unit = await repo.archiveUnit(id)
  
  await logAudit({
    officeId,
    userId,
    entityType: 'Unit',
    entityId: unit.id,
    action: 'ARCHIVE',
  })
  
  return unit
}
