import 'server-only'

import { prisma } from '@/lib/db'
import { logAudit } from '@/modules/audit/server/services'
import {
  addAgendaItemSchema,
  changeMeetingStatusSchema,
  createMeetingSchema,
  saveMeetingMinuteSchema,
  updateMeetingSchema,
  type AddAgendaItemInput,
  type ChangeMeetingStatusInput,
  type CreateMeetingInput,
  type SaveMeetingMinuteInput,
  type UpdateMeetingInput,
} from '@/modules/meetings/schema'

const ALLOWED_MEETING_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SCHEDULED', 'CLOSED'],
  SCHEDULED: ['HELD', 'CLOSED'],
  HELD: ['CLOSED'],
  CLOSED: [],
}

export function canTransitionMeetingStatus(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true
  return (ALLOWED_MEETING_TRANSITIONS[currentStatus] ?? []).includes(nextStatus)
}

function parseDateInput(value: string, fieldName: string): Date {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Fecha inválida en ${fieldName}`)
  }
  return parsed
}

async function requireCommunityInOffice(officeId: string, communityId: string) {
  const community = await prisma.community.findFirst({
    where: {
      id: communityId,
      officeId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      officeId: true,
    },
  })

  if (!community) {
    throw new Error('La comunidad no existe o no pertenece al despacho.')
  }

  return community
}

async function requireMeetingInOffice(officeId: string, meetingId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      community: {
        officeId,
        archivedAt: null,
      },
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          officeId: true,
        },
      },
      minutes: {
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  })

  if (!meeting) {
    throw new Error('La reunión no existe o no pertenece al despacho.')
  }

  return meeting
}

export async function createMeeting(officeId: string, userId: string, rawInput: CreateMeetingInput) {
  const input = createMeetingSchema.parse(rawInput)
  const community = await requireCommunityInOffice(officeId, input.communityId)
  const scheduledAt = parseDateInput(input.scheduledAt, 'scheduledAt')

  const meeting = await prisma.meeting.create({
    data: {
      communityId: community.id,
      title: input.title,
      meetingType: input.meetingType,
      scheduledAt,
      location: input.location ?? null,
      description: input.description ?? null,
      status: input.status,
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: meeting.id,
    action: 'CREATE',
    meta: {
      communityId: meeting.communityId,
      title: meeting.title,
      status: meeting.status,
      scheduledAt: meeting.scheduledAt.toISOString(),
    },
  })

  return meeting
}

export async function updateMeeting(
  officeId: string,
  userId: string,
  meetingId: string,
  rawInput: UpdateMeetingInput,
) {
  const input = updateMeetingSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada y no admite cambios generales.')
  }

  const updated = await prisma.meeting.update({
    where: { id: meeting.id },
    data: {
      title: input.title ?? undefined,
      meetingType: input.meetingType ?? undefined,
      scheduledAt: input.scheduledAt ? parseDateInput(input.scheduledAt, 'scheduledAt') : undefined,
      location: input.location === undefined ? undefined : input.location,
      description: input.description === undefined ? undefined : input.description,
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      minutes: {
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: updated.id,
    action: 'UPDATE',
    meta: {
      type: 'MEETING_UPDATE',
      title: updated.title,
      scheduledAt: updated.scheduledAt.toISOString(),
      location: updated.location,
    },
  })

  return updated
}

export async function addAgendaItem(
  officeId: string,
  userId: string,
  rawInput: AddAgendaItemInput,
) {
  const input = addAgendaItemSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada y no admite nuevos puntos del orden del día.')
  }

  const lastAgendaItem = await prisma.agendaItem.findFirst({
    where: { meetingId: meeting.id },
    select: { sortOrder: true },
    orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
  })

  const agendaItem = await prisma.agendaItem.create({
    data: {
      meetingId: meeting.id,
      title: input.title,
      description: input.description ?? null,
      sortOrder:
        input.sortOrder ?? (lastAgendaItem?.sortOrder != null ? lastAgendaItem.sortOrder + 1 : 1),
    },
  })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: meeting.id,
    action: 'CREATE',
    meta: {
      type: 'AGENDA_ITEM_CREATE',
      agendaItemId: agendaItem.id,
      title: agendaItem.title,
      sortOrder: agendaItem.sortOrder,
    },
  })

  return agendaItem
}

export async function changeMeetingStatus(
  officeId: string,
  userId: string,
  rawInput: ChangeMeetingStatusInput,
) {
  const input = changeMeetingStatusSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (!canTransitionMeetingStatus(meeting.status, input.status)) {
    throw new Error(`No se permite pasar de ${meeting.status} a ${input.status}.`)
  }

  const updated = await prisma.meeting.update({
    where: { id: meeting.id },
    data: { status: input.status },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: updated.id,
    action: 'STATUS_CHANGE',
    meta: {
      previousStatus: meeting.status,
      nextStatus: updated.status,
    },
  })

  return updated
}

export async function saveMeetingMinute(
  officeId: string,
  userId: string,
  rawInput: SaveMeetingMinuteInput,
) {
  const input = saveMeetingMinuteSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (input.status === 'APPROVED' && !['HELD', 'CLOSED'].includes(meeting.status)) {
    throw new Error('Solo se puede aprobar un acta cuando la reunión ya ha sido celebrada.')
  }

  const previousMinute = meeting.minutes[0] ?? null

  const minute = previousMinute
    ? await prisma.minute.update({
        where: { id: previousMinute.id },
        data: {
          content: input.content,
          status: input.status,
          approvedAt: input.status === 'APPROVED' ? new Date() : null,
        },
      })
    : await prisma.minute.create({
        data: {
          meetingId: meeting.id,
          content: input.content,
          status: input.status,
          approvedAt: input.status === 'APPROVED' ? new Date() : null,
        },
      })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: meeting.id,
    action: 'UPDATE',
    meta: {
      type: 'MINUTE_UPSERT',
      minuteId: minute.id,
      previousStatus: previousMinute?.status ?? null,
      nextStatus: minute.status,
    },
  })

  return minute
}
