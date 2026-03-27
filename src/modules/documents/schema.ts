import { DocumentVisibility } from '@prisma/client'
import { z } from 'zod'

const documentVisibilitySchema = z.enum(['INTERNAL', 'OWNERS', 'PUBLIC'])

const nullableTrimmedString = z
  .string()
  .trim()
  .max(160)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) return null
    return value.length ? value : null
  })

export const uploadDocumentMetadataSchema = z.object({
  communityId: z.string().cuid(),
  title: z.string().trim().min(3).max(160),
  category: nullableTrimmedString,
  visibility: documentVisibilitySchema.default('INTERNAL'),
})

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  category: nullableTrimmedString.optional(),
  visibility: documentVisibilitySchema.optional(),
})

export type UploadDocumentMetadataInput = z.input<typeof uploadDocumentMetadataSchema>
export type UpdateDocumentInput = z.input<typeof updateDocumentSchema>

export function parseDocumentVisibility(value: string | undefined): DocumentVisibility | undefined {
  if (!value) return undefined
  const parsed = documentVisibilitySchema.safeParse(value)
  return parsed.success ? (parsed.data as DocumentVisibility) : undefined
}
