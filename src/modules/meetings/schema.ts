import { MeetingStatus, MeetingType, MinuteStatus } from '@prisma/client'
import { z } from 'zod'

const meetingTypeSchema = z.enum(['ORDINARY', 'EXTRAORDINARY'])
const meetingStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'HELD', 'CLOSED'])
const minuteStatusSchema = z.enum(['DRAFT', 'GENERATED', 'APPROVED'])

const nullableTrimmedString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) return null
    return value.length ? value : null
  })

export const createMeetingSchema = z.object({
  communityId: z.string().cuid(),
  title: z.string().trim().min(3).max(160),
  meetingType: meetingTypeSchema.default('ORDINARY'),
  scheduledAt: z.string().min(1),
  location: z.string().trim().max(160).optional().nullable().transform((value) => {
    if (value == null) return null
    return value.length ? value : null
  }),
  description: nullableTrimmedString,
  status: meetingStatusSchema.default('SCHEDULED'),
})

export const updateMeetingSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  meetingType: meetingTypeSchema.optional(),
  scheduledAt: z.string().min(1).optional(),
  location: z.string().trim().max(160).optional().nullable().transform((value) => {
    if (value == null) return null
    return value.length ? value : null
  }),
  description: nullableTrimmedString.optional(),
})

export const addAgendaItemSchema = z.object({
  meetingId: z.string().cuid(),
  title: z.string().trim().min(3).max(160),
  description: nullableTrimmedString,
  sortOrder: z.number().int().min(0).optional(),
})

export const changeMeetingStatusSchema = z.object({
  meetingId: z.string().cuid(),
  status: meetingStatusSchema,
})

export const saveMeetingMinuteSchema = z.object({
  meetingId: z.string().cuid(),
  content: z.string().trim().min(3).max(20000),
  status: minuteStatusSchema.default('DRAFT'),
})

export type MeetingStatusValue = z.infer<typeof meetingStatusSchema>
export type MeetingTypeValue = z.infer<typeof meetingTypeSchema>
export type MinuteStatusValue = z.infer<typeof minuteStatusSchema>

export type CreateMeetingInput = z.input<typeof createMeetingSchema>
export type UpdateMeetingInput = z.input<typeof updateMeetingSchema>
export type AddAgendaItemInput = z.input<typeof addAgendaItemSchema>
export type ChangeMeetingStatusInput = z.input<typeof changeMeetingStatusSchema>
export type SaveMeetingMinuteInput = z.input<typeof saveMeetingMinuteSchema>

export function parseMeetingStatus(value: string | undefined): MeetingStatus | undefined {
  if (!value) return undefined
  const parsed = meetingStatusSchema.safeParse(value)
  return parsed.success ? (parsed.data as MeetingStatus) : undefined
}

export function parseMeetingType(value: string | undefined): MeetingType | undefined {
  if (!value) return undefined
  const parsed = meetingTypeSchema.safeParse(value)
  return parsed.success ? (parsed.data as MeetingType) : undefined
}

export function parseMinuteStatus(value: string | undefined): MinuteStatus | undefined {
  if (!value) return undefined
  const parsed = minuteStatusSchema.safeParse(value)
  return parsed.success ? (parsed.data as MinuteStatus) : undefined
}
