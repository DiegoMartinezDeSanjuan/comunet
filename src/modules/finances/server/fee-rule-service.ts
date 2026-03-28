import 'server-only'
import * as repo from './fee-rule-repository'
import { feeRuleSchema, type FeeRuleInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { prisma } from '@/lib/db'

export async function getCommunityFeeRulesService(communityId: string) {
  return repo.findFeeRulesByCommunity(communityId)
}

export async function getFeeRuleService(id: string) {
  return repo.findFeeRuleById(id)
}

export async function createFeeRuleService(officeId: string, userId: string, data: FeeRuleInput) {
  const valid = feeRuleSchema.parse(data)

  const community = await prisma.community.findFirst({
    where: { id: valid.communityId, officeId },
  })

  if (!community) throw new Error('Comunidad no encontrada o sin acceso')

  const rule = await repo.createFeeRule(valid)

  logAudit({
    officeId,
    userId,
    entityType: 'FeeRule',
    entityId: rule.id,
    action: 'CREATE',
    meta: { name: rule.name, communityId: valid.communityId },
  })

  return rule
}

export async function updateFeeRuleService(id: string, officeId: string, userId: string, data: FeeRuleInput) {
  const valid = feeRuleSchema.parse(data)

  const existingRule = await prisma.feeRule.findFirst({
    where: {
      id,
      community: { officeId },
    },
  })

  if (!existingRule) throw new Error('Regla de cuota no encontrada o sin acceso')

  const community = await prisma.community.findFirst({
    where: { id: valid.communityId, officeId },
  })

  if (!community) throw new Error('Comunidad no encontrada o sin acceso')

  const rule = await repo.updateFeeRule(id, valid)

  logAudit({
    officeId,
    userId,
    entityType: 'FeeRule',
    entityId: rule.id,
    action: 'UPDATE',
    meta: { name: rule.name, active: rule.active },
  })

  return rule
}

export async function toggleFeeRuleService(id: string, officeId: string, userId: string, active: boolean) {
  const existingRule = await prisma.feeRule.findFirst({
    where: {
      id,
      community: { officeId },
    },
  })

  if (!existingRule) throw new Error('Regla de cuota no encontrada o sin acceso')

  const rule = await repo.toggleFeeRuleStatus(id, active)

  logAudit({
    officeId,
    userId,
    entityType: 'FeeRule',
    entityId: rule.id,
    action: 'STATUS_CHANGE',
    meta: { active },
  })

  return rule
}
