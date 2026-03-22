'use server'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import * as service from './unit-service'
import { type BuildingInput, type UnitInput } from '../schema'
import { revalidatePath } from 'next/cache'

export async function createBuildingAction(data: BuildingInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) throw new Error('No autorizado')

  try {
    const res = await service.createBuildingService(session.officeId, session.userId, data)
    revalidatePath(`/communities/${data.communityId}/units`)
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

export async function createUnitAction(data: UnitInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) throw new Error('No autorizado')

  try {
    const res = await service.createUnitService(session.officeId, session.userId, data)
    revalidatePath(`/communities/${data.communityId}/units`)
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

export async function updateUnitAction(id: string, data: UnitInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) throw new Error('No autorizado')

  try {
    const res = await service.updateUnitService(id, session.officeId, session.userId, data)
    revalidatePath(`/communities/${data.communityId}/units`)
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}

export async function archiveUnitAction(id: string, communityId: string) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) throw new Error('No autorizado')

  try {
    await service.archiveUnitService(id, session.officeId, session.userId)
    revalidatePath(`/communities/${communityId}/units`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}
