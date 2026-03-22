'use server'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import * as service from './community-service'
import { type CommunityInput } from '../schema'
import { revalidatePath } from 'next/cache'

export async function createCommunityAction(data: CommunityInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) {
    throw new Error('No autorizado')
  }

  try {
    const community = await service.createCommunityService(session.officeId, session.userId, data)
    revalidatePath('/communities')
    return { success: true, data: community }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al crear comunidad' }
  }
}

export async function updateCommunityAction(id: string, data: CommunityInput) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) {
    throw new Error('No autorizado')
  }

  try {
    const community = await service.updateCommunityService(id, session.officeId, session.userId, data)
    revalidatePath('/communities')
    revalidatePath(`/communities/${id}`)
    return { success: true, data: community }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar comunidad' }
  }
}

export async function archiveCommunityAction(id: string) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) {
    throw new Error('No autorizado')
  }

  try {
    await service.archiveCommunityService(id, session.officeId, session.userId)
    revalidatePath('/communities')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al archivar comunidad' }
  }
}
