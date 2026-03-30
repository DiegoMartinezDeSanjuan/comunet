import 'server-only'
import * as repo from './contact-repository'
import { ownerSchema, tenantSchema, ownershipSchema, boardPositionSchema, type OwnerInput, type TenantInput, type OwnershipInput, type BoardPositionInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { prisma } from '@/lib/db'

// --- Owners ---
export async function getOwners(officeId: string, search?: string) {
  return repo.findOwnersByOffice(officeId, search)
}

export async function getOwnerDetails(id: string, officeId: string) {
  return repo.findOwnerById(id, officeId)
}

export async function createOwnerService(officeId: string, userId: string, data: OwnerInput) {
  const valid = ownerSchema.parse(data)
  const owner = await repo.createOwner({ ...valid, officeId })
  
  logAudit({
    officeId, userId, entityType: 'Owner', entityId: owner.id,
    action: 'CREATE', meta: { fullName: owner.fullName, dni: owner.dni }
  })
  
  return owner
}

export async function updateOwnerService(id: string, officeId: string, userId: string, data: OwnerInput) {
  const valid = ownerSchema.parse(data)
  const owner = await repo.updateOwner(id, officeId, valid)
  
  logAudit({
    officeId, userId, entityType: 'Owner', entityId: owner.id,
    action: 'UPDATE', meta: { fullName: owner.fullName }
  })
  
  return owner
}

// --- Tenants ---
export async function getTenants(officeId: string, search?: string) {
  return repo.findTenantsByOffice(officeId, search)
}

export async function getTenantDetails(id: string, officeId: string) {
  return repo.findTenantById(id, officeId)
}

export async function createTenantService(officeId: string, userId: string, data: TenantInput) {
  const valid = tenantSchema.parse(data)
  const tenant = await repo.createTenant({ ...valid, officeId })
  
  logAudit({
    officeId, userId, entityType: 'Tenant', entityId: tenant.id,
    action: 'CREATE', meta: { fullName: tenant.fullName }
  })
  
  return tenant
}

export async function updateTenantService(id: string, officeId: string, userId: string, data: TenantInput) {
  const valid = tenantSchema.parse(data)
  const tenant = await repo.updateTenant(id, officeId, valid)
  
  logAudit({
    officeId, userId, entityType: 'Tenant', entityId: tenant.id,
    action: 'UPDATE', meta: { fullName: tenant.fullName }
  })
  
  return tenant
}

// --- Associations ---
export async function createOwnershipService(officeId: string, userId: string, data: OwnershipInput) {
  const valid = ownershipSchema.parse(data)
  const ownership = await repo.createOwnership({
    ...valid,
    startDate: valid.startDate ? new Date(valid.startDate) : undefined,
    endDate: valid.endDate ? new Date(valid.endDate) : undefined,
  })
  
  logAudit({
    officeId, userId, entityType: 'Ownership', entityId: ownership.id,
    action: 'CREATE', meta: { ownerId: valid.ownerId, unitId: valid.unitId }
  })
  
  return ownership
}

export async function createBoardPositionService(officeId: string, userId: string, data: BoardPositionInput) {
  const valid = boardPositionSchema.parse(data)
  const position = await repo.createBoardPosition({
    ...valid,
    startDate: valid.startDate ? new Date(valid.startDate) : undefined,
    endDate: valid.endDate ? new Date(valid.endDate) : undefined,
  })

  // Auto-assign PRESIDENT user role when board position is PRESIDENT
  if (valid.role === 'PRESIDENT') {
    const linkedUser = await prisma.user.findFirst({
      where: { linkedOwnerId: valid.ownerId, officeId },
    })
    if (linkedUser && linkedUser.role !== 'PRESIDENT') {
      await prisma.user.update({
        where: { id: linkedUser.id },
        data: { role: 'PRESIDENT' },
      })
      logAudit({
        officeId, userId, entityType: 'User', entityId: linkedUser.id,
        action: 'STATUS_CHANGE',
        meta: { reason: 'Auto-assigned PRESIDENT role from board position', previousRole: linkedUser.role },
      })
    }
  }
  
  logAudit({
    officeId, userId, entityType: 'BoardPosition', entityId: position.id,
    action: 'CREATE', meta: { ownerId: valid.ownerId, role: valid.role }
  })
  
  return position
}

