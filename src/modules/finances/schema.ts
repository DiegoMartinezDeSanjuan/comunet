import { z } from 'zod'

// -- ENUMS --
export const budgetStatusEnum = z.enum(['DRAFT', 'APPROVED', 'CLOSED'])
export const feeFrequencyEnum = z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'])
export const receiptStatusEnum = z.enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'RETURNED', 'CANCELLED'])
export const paymentMethodEnum = z.enum(['BANK_TRANSFER', 'DIRECT_DEBIT', 'CASH', 'CHECK', 'OTHER'])
export const debtStatusEnum = z.enum(['PENDING', 'PARTIALLY_PAID', 'PAID', 'WRITTEN_OFF'])
export const calculationBaseEnum = z.enum(['COEFFICIENT', 'QUOTA_PERCENT', 'FIXED'])

// -- BUDGETS --
export const budgetSchema = z.object({
  communityId: z.string().min(1, "Comunidad requerida"),
  year: z.number().int().min(2000).max(2100),
  status: budgetStatusEnum.default('DRAFT'),
})

export type BudgetInput = z.infer<typeof budgetSchema>

export const budgetLineSchema = z.object({
  budgetId: z.string().min(1),
  concept: z.string().min(1, "Concepto requerido"),
  category: z.string().optional().nullable(),
  amount: z.number().min(0),
  periodicity: z.string().optional().nullable(),
})

export type BudgetLineInput = z.infer<typeof budgetLineSchema>

// -- FEE RULES --
export const feeRuleSchema = z.object({
  communityId: z.string().min(1, "Comunidad requerida"),
  name: z.string().min(1, "Nombre requerido"),
  frequency: feeFrequencyEnum.default('MONTHLY'),
  startDate: z.string(), // ISO String
  calculationBase: calculationBaseEnum,
  fixedAmount: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  active: z.boolean().default(true),
})

export type FeeRuleInput = z.infer<typeof feeRuleSchema>

// -- RECEIPTS (Mass Generation Input) --
export const generateReceiptsSchema = z.object({
  communityId: z.string().min(1, "Comunidad requerida"),
  feeRuleId: z.string().min(1, "Regla de cuota requerida"),
  periodStart: z.string(), // ISO String
  periodEnd: z.string(), // ISO String
  issueDate: z.string(), // ISO String
  dueDate: z.string(), // ISO String
})

export type GenerateReceiptsInput = z.infer<typeof generateReceiptsSchema>

// -- PAYMENTS --
export const paymentSchema = z.object({
  receiptId: z.string().min(1),
  amount: z.number().min(0.01),
  paymentDate: z.string(), // ISO string
  method: paymentMethodEnum.default('BANK_TRANSFER'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type PaymentInput = z.infer<typeof paymentSchema>
