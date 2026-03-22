'use server'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import * as service from './contact-service'
import { type OwnerInput, type TenantInput, type OwnershipInput, type BoardPositionInput } from '../schema'
import { revalidatePath } from 'next/cache'

// --- Owners ---
export async function createOwnerAction(data: OwnerInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'owners.manage')) throw new Error('No autorizado')

  try {
    const res = await service.createOwnerService(session.officeId, session.userId, data)
    revalidatePath('/owners')
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

export async function updateOwnerAction(id: string, data: OwnerInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'owners.manage')) throw new Error('No autorizado')

  try {
    const res = await service.updateOwnerService(id, session.officeId, session.userId, data)
    revalidatePath('/owners')
    revalidatePath(`/owners/${id}`)
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

// --- Tenants ---
export async function createTenantAction(data: TenantInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'owners.manage')) throw new Error('No autorizado')

  try {
    const res = await service.createTenantService(session.officeId, session.userId, data)
    revalidatePath('/tenants')
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

export async function updateTenantAction(id: string, data: TenantInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'owners.manage')) throw new Error('No autorizado')

  try {
    const res = await service.updateTenantService(id, session.officeId, session.userId, data)
    revalidatePath('/tenants')
    revalidatePath(`/tenants/${id}`)
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

// --- Associations ---
export async function createOwnershipAction(data: OwnershipInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'owners.manage')) throw new Error('No autorizado')

  try {
    const res = await service.createOwnershipService(session.officeId, session.userId, data)
    revalidatePath(`/owners/${data.ownerId}`)
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

export async function createBoardPositionAction(data: BoardPositionInput, communityId: string) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) throw new Error('No autorizado')

  try {
    const res = await service.createBoardPositionService(session.officeId, session.userId, data)
    revalidatePath(`/communities/${communityId}/board`)
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}
