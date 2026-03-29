import 'server-only'
import * as repo from './repository'
import { communitySchema, type CommunityInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'

export async function getCommunities(officeId: string, search?: string) {
  return repo.findCommunitiesByOffice(officeId, search)
}

export async function getCommunityDetails(id: string, officeId: string) {
  return repo.findCommunityById(id, officeId)
}

export async function createCommunityService(officeId: string, userId: string, data: CommunityInput) {
  const validData = communitySchema.parse(data)
  
  const community = await repo.createCommunity(officeId, validData)
  
  logAudit({
    officeId,
    userId,
    entityType: 'Community',
    entityId: community.id,
    action: 'CREATE',
    meta: { name: community.name }
  })
  
  return community
}

export async function updateCommunityService(id: string, officeId: string, userId: string, data: CommunityInput) {
  const validData = communitySchema.parse(data)
  
  const community = await repo.updateCommunity(id, officeId, validData)
  
  logAudit({
    officeId,
    userId,
    entityType: 'Community',
    entityId: community.id,
    action: 'UPDATE',
    meta: { name: community.name }
  })
  
  return community
}

export async function archiveCommunityService(id: string, officeId: string, userId: string) {
  const community = await repo.archiveCommunity(id, officeId)
  
  logAudit({
    officeId,
    userId,
    entityType: 'Community',
    entityId: community.id,
    action: 'ARCHIVE',
  })
  
  return community
}
