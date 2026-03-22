import { z } from 'zod'

export const communitySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  cif: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  fiscalYear: z.number().int().min(2000).max(2100),
  notes: z.string().optional().nullable(),
})

export type CommunityInput = z.infer<typeof communitySchema>
