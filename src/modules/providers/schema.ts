import { z } from 'zod'

const nullableString = z.string().trim().min(1).nullable().optional()

export const providerSchema = z.object({
    name: z.string().trim().min(2, 'Nombre requerido').max(160),
    cif: nullableString,
    email: z.string().trim().email().nullable().optional(),
    phone: nullableString,
    category: nullableString,
    address: nullableString,
    notes: z.string().trim().max(5000).nullable().optional(),
})

export type ProviderInput = z.infer<typeof providerSchema>

export const updateProviderSchema = providerSchema.extend({
    archived: z.boolean().optional(),
})

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>

export const providerListFiltersSchema = z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    archived: z.boolean().optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
})

export type ProviderListFiltersInput = z.infer<typeof providerListFiltersSchema>
