'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import * as budgetService from './budget-service'
import * as feeRuleService from './fee-rule-service'
import * as receiptService from './receipt-service'
import * as paymentService from './payment-service'
import { BudgetInput, BudgetLineInput, FeeRuleInput, GenerateReceiptsInput, PaymentInput } from '../schema'

async function getOfficeAndUser(permission: string) {
  const session = await requireAuth()
  if (!session || !requirePermission(session, permission)) {
    throw new Error('No autorizado')
  }
  return { officeId: session.officeId, userId: session.userId }
}

// -- BUDGETS --
export async function createBudgetAction(data: BudgetInput) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const budget = await budgetService.createBudgetService(officeId, userId, data)
  revalidatePath('/finance/budgets')
  return budget
}

export async function updateBudgetStatusAction(id: string, status: any) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const budget = await budgetService.updateBudgetService(id, officeId, userId, { status })
  revalidatePath(`/finance/budgets/${id}`)
  return budget
}

export async function addBudgetLineAction(data: BudgetLineInput) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const line = await budgetService.addBudgetLineService(officeId, userId, data)
  revalidatePath(`/finance/budgets/${data.budgetId}`)
  return line
}

export async function deleteBudgetLineAction(id: string, budgetId: string) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  await budgetService.deleteBudgetLineService(id, officeId, userId)
  revalidatePath(`/finance/budgets/${budgetId}`)
  return true
}

// -- FEE RULES --
export async function createFeeRuleAction(data: FeeRuleInput) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const rule = await feeRuleService.createFeeRuleService(officeId, userId, data)
  revalidatePath(`/communities/${data.communityId}`)
  return rule
}

export async function toggleFeeRuleAction(id: string, communityId: string, active: boolean) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const rule = await feeRuleService.toggleFeeRuleService(id, officeId, userId, active)
  revalidatePath(`/communities/${communityId}`)
  return rule
}

// -- RECEIPTS --
export async function generateReceiptsAction(data: GenerateReceiptsInput) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const result = await receiptService.generateReceiptsService(officeId, userId, data)
  revalidatePath('/finance/receipts')
  return result
}

export async function markReceiptReturnedAction(id: string) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const receipt = await receiptService.markReceiptReturnedService(id, officeId, userId)
  revalidatePath(`/finance/receipts/${id}`)
  return receipt
}

export async function markReceiptCancelledAction(id: string) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const receipt = await receiptService.markReceiptCancelledService(id, officeId, userId)
  revalidatePath(`/finance/receipts/${id}`)
  return receipt
}

// -- PAYMENTS --
export async function registerPaymentAction(data: PaymentInput) {
  const { officeId, userId } = await getOfficeAndUser('finances.manage')
  const result = await paymentService.registerPaymentService(officeId, userId, data)
  revalidatePath(`/finance/receipts/${data.receiptId}`)
  return result
}
