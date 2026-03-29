import { z } from 'zod'

export const buildingSchema = z.object({
  communityId: z.string().min(1),
  name: z.string().min(1, 'El nombre del edificio es obligatorio'),
})
export type BuildingInput = z.infer<typeof buildingSchema>

export const unitSchema = z.object({
  communityId: z.string().min(1),
  buildingId: z.string().optional().nullable(),
  reference: z.string().min(1, 'La referencia (Ej: 1A) es obligatoria'),
  type: z.enum(['APARTMENT', 'GARAGE', 'STORAGE', 'COMMERCIAL', 'OTHER']),
  floor: z.string().optional().nullable(),
  door: z.string().optional().nullable(),
  areaM2: z.number().min(0).optional().nullable(),
  coefficient: z.number().min(0).max(100).optional().nullable(),
  quotaPercent: z.number().min(0).max(100).optional().nullable(),
  active: z.boolean(),
})
export type UnitInput = z.infer<typeof unitSchema>
