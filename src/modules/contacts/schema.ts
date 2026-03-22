import { z } from 'zod'

export const ownerSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es obligatorio'),
  dni: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
})
export type OwnerInput = z.infer<typeof ownerSchema>

export const tenantSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es obligatorio'),
  dni: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
export type TenantInput = z.infer<typeof tenantSchema>

export const ownershipSchema = z.object({
  unitId: z.string().min(1),
  ownerId: z.string().min(1),
  ownershipPercent: z.number().min(0.01).max(100),
  isPrimaryBillingContact: z.boolean(),
  startDate: z.string().optional().nullable(), // ISO String or empty
  endDate: z.string().optional().nullable(),
})
export type OwnershipInput = z.infer<typeof ownershipSchema>

export const boardPositionSchema = z.object({
  communityId: z.string().min(1),
  ownerId: z.string().min(1),
  role: z.string(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})
export type BoardPositionInput = z.infer<typeof boardPositionSchema>
