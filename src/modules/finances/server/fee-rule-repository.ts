import 'server-only'
import { prisma } from '@/lib/db'
import { FeeRuleInput } from '../schema'

export async function findFeeRulesByCommunity(communityId: string) {
  return prisma.feeRule.findMany({
    where: { communityId },
  })
}

export async function findFeeRulesByOffice(officeId: string) {
  return prisma.feeRule.findMany({
    where: { community: { officeId }, active: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function findFeeRuleById(id: string) {
  return prisma.feeRule.findUnique({
    where: { id },
    include: {
      community: true
    }
  })
}

export async function createFeeRule(data: FeeRuleInput) {
  return prisma.feeRule.create({
    data: {
      ...data,
      fixedAmount: data.fixedAmount ?? undefined,
      notes: data.notes ?? undefined,
      startDate: new Date(data.startDate)
    }
  })
}

export async function updateFeeRule(id: string, data: FeeRuleInput) {
  return prisma.feeRule.update({
    where: { id },
    data: {
      ...data,
      fixedAmount: data.fixedAmount ?? undefined,
      notes: data.notes ?? undefined,
      startDate: new Date(data.startDate)
    }
  })
}

export async function toggleFeeRuleStatus(id: string, active: boolean) {
  return prisma.feeRule.update({
    where: { id },
    data: { active }
  })
}
