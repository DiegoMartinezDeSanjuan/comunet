import 'server-only'
import * as repo from './budget-repository'
import { budgetSchema, budgetLineSchema, type BudgetInput, type BudgetLineInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { prisma } from '@/lib/db'

export async function getBudgetsService(communityId: string) {
  return repo.findBudgetsByCommunity(communityId)
}

export async function getBudgetDetailsService(id: string) {
  return repo.findBudgetById(id)
}

export async function createBudgetService(officeId: string, userId: string, data: BudgetInput) {
  const valid = budgetSchema.parse(data)
  
  // Verify community belongs to office
  const community = await prisma.community.findFirst({ where: { id: valid.communityId, officeId } })
  if (!community) throw new Error("Comunidad no encontrada o sin acceso")

  // Check for duplicate year
  const existing = await prisma.budget.findUnique({
    where: { communityId_year: { communityId: valid.communityId, year: valid.year } }
  })
  if (existing) throw new Error("Ya existe un presupuesto para ese año en esta comunidad")
    
  const budget = await repo.createBudget(valid)
  
  await logAudit({
    officeId,
    userId,
    entityType: 'Budget',
    entityId: budget.id,
    action: 'CREATE',
    meta: { year: budget.year, communityId: valid.communityId }
  })
  
  return budget
}

export async function updateBudgetService(id: string, officeId: string, userId: string, data: Partial<BudgetInput>) {
  // Can only update status or safe fields
  const budget = await repo.updateBudget(id, { status: data.status })
  
  await logAudit({
    officeId,
    userId,
    entityType: 'Budget',
    entityId: budget.id,
    action: 'UPDATE',
    meta: { status: data.status }
  })
  
  return budget
}

export async function addBudgetLineService(officeId: string, userId: string, data: BudgetLineInput) {
  const valid = budgetLineSchema.parse(data)
  
  const budget = await repo.findBudgetById(valid.budgetId)
  if (!budget) throw new Error("Presupuesto no encontrado")
  if (budget.status !== 'DRAFT') throw new Error("Solo se pueden añadir líneas a presupuestos en borrador")
    
  const line = await repo.createBudgetLine(valid)
  
  // Recalculate total amount
  const newTotal = budget.lines.reduce((acc, curr) => acc + Number(curr.amount), 0) + valid.amount
  await repo.updateBudgetTotalAmount(budget.id, newTotal)
  
  await logAudit({
    officeId,
    userId,
    entityType: 'BudgetLine',
    entityId: line.id,
    action: 'CREATE',
    meta: { budgetId: budget.id, amount: valid.amount }
  })
  
  return line
}

export async function deleteBudgetLineService(id: string, officeId: string, userId: string) {
  const line = await prisma.budgetLine.findUnique({ where: { id }, include: { budget: true } })
  if (!line) throw new Error("Línea no encontrada")
  if (line.budget.status !== 'DRAFT') throw new Error("Solo se pueden borrar líneas en un presupuesto borrador")

  await repo.deleteBudgetLine(id)

  // Recalculate total
  const remainingLines = await prisma.budgetLine.findMany({ where: { budgetId: line.budgetId } })
  const newTotal = remainingLines.reduce((acc, curr) => acc + Number(curr.amount), 0)
  await repo.updateBudgetTotalAmount(line.budgetId, newTotal)

  await logAudit({
    officeId,
    userId,
    entityType: 'BudgetLine',
    entityId: line.id,
    action: 'DELETE',
    meta: { budgetId: line.budgetId }
  })

  return true
}
