import { z } from 'zod'

export const incidentPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const incidentStatusEnum = z.enum([
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_VENDOR',
    'RESOLVED',
    'CLOSED',
])

export const incidentCommentVisibilityEnum = z.enum(['INTERNAL', 'SHARED'])

const nullableString = z.string().trim().min(1).nullable().optional()

export const createIncidentSchema = z.object({
    communityId: z.string().trim().min(1, 'Comunidad requerida'),
    unitId: nullableString,
    assignedProviderId: nullableString,
    title: z.string().trim().min(3, 'Título demasiado corto').max(160),
    description: z.string().trim().max(5000).nullable().optional(),
    priority: incidentPriorityEnum.default('MEDIUM'),
    reportedAt: z.string().datetime().optional(),
    dueAt: z.string().datetime().nullable().optional(),
})

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>

export const updateIncidentSchema = z.object({
    communityId: z.string().trim().min(1).optional(),
    unitId: nullableString,
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    priority: incidentPriorityEnum.optional(),
    dueAt: z.string().datetime().nullable().optional(),
})

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>

export const assignProviderSchema = z.object({
    incidentId: z.string().trim().min(1),
    providerId: z.string().trim().min(1, 'Proveedor requerido'),
})

export type AssignProviderInput = z.infer<typeof assignProviderSchema>

export const changeIncidentStatusSchema = z.object({
    incidentId: z.string().trim().min(1),
    status: incidentStatusEnum,
})

export type ChangeIncidentStatusInput = z.infer<typeof changeIncidentStatusSchema>

export const addIncidentCommentSchema = z.object({
    incidentId: z.string().trim().min(1),
    body: z.string().trim().min(1, 'Comentario requerido').max(4000),
    visibility: incidentCommentVisibilityEnum.default('INTERNAL'),
})

export type AddIncidentCommentInput = z.infer<typeof addIncidentCommentSchema>

export const incidentListFiltersSchema = z.object({
    search: z.string().trim().optional(),
    communityId: z.string().trim().optional(),
    providerId: z.string().trim().optional(),
    status: incidentStatusEnum.optional(),
    priority: incidentPriorityEnum.optional(),
    createdByUserId: z.string().trim().optional(),
    overdue: z.boolean().optional(),
    openOnly: z.boolean().optional(),
    closedOnly: z.boolean().optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
})

export type IncidentListFiltersInput = z.infer<typeof incidentListFiltersSchema>
