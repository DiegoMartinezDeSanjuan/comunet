import 'server-only'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { BudgetInput } from '../schema'

export async function findBudgetsByCommunity(communityId: string) {
  return prisma.budget.findMany({
    where: { communityId },
    include: {
      lines: true
    },
  })
}

export async function findBudgetsByOffice(officeId: string) {
  return prisma.budget.findMany({
    where: { community: { officeId } },
    include: {
      community: true,
      lines: true
    },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }]
  })
}

export async function findBudgetById(id: string) {
  return prisma.budget.findUnique({
    where: { id },
    include: {
      community: true,
      lines: true
    }
  })
}

export async function createBudget(data: BudgetInput) {
  return prisma.budget.create({
    data,
    include: { lines: true }
  })
}

export async function updateBudget(id: string, data: Partial<BudgetInput>) {
  return prisma.budget.update({
    where: { id },
    data,
    include: { lines: true }
  })
}

export async function updateBudgetTotalAmount(id: string, totalAmount: number) {
  return prisma.budget.update({
    where: { id },
    data: { totalAmount }
  })
}

export async function createBudgetLine(data: any) {
  return prisma.budgetLine.create({
    data
  })
}

export async function updateBudgetLine(id: string, data: any) {
  return prisma.budgetLine.update({
    where: { id },
    data
  })
}

export async function deleteBudgetLine(id: string) {
  return prisma.budgetLine.delete({
    where: { id }
  })
}
