import 'server-only'

import { prisma } from '@/lib/db'
import { logAudit } from '@/modules/audit/server/services'
import {
  addAgendaItemSchema,
  changeMeetingStatusSchema,
  createMeetingSchema,
  saveMeetingMinuteSchema,
  updateMeetingSchema,
  updateAgendaItemSchema,
  reorderAgendaItemsSchema,
  deleteAgendaItemSchema,
  recordAttendanceSchema,
  deleteAttendanceSchema,
  recordVoteSchema,
  deleteVoteSchema,
  generateMinuteDraftSchema,
  type AddAgendaItemInput,
  type ChangeMeetingStatusInput,
  type CreateMeetingInput,
  type SaveMeetingMinuteInput,
  type UpdateMeetingInput,
  type UpdateAgendaItemInput,
  type ReorderAgendaItemsInput,
  type DeleteAgendaItemInput,
  type RecordAttendanceInput,
  type DeleteAttendanceInput,
  type RecordVoteInput,
  type DeleteVoteInput,
  type GenerateMinuteDraftInput,
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

export async function updateAgendaItem(
  officeId: string,
  userId: string,
  rawInput: UpdateAgendaItemInput,
) {
  const input = updateAgendaItemSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada y no admite cambios en el orden del día.')
  }

  const agendaItem = await prisma.agendaItem.findFirst({
    where: { id: input.agendaItemId, meetingId: meeting.id },
  })

  if (!agendaItem) {
    throw new Error('El punto del orden del día no existe.')
  }

  const updated = await prisma.agendaItem.update({
    where: { id: agendaItem.id },
    data: {
      title: input.title ?? undefined,
      description: input.description === undefined ? undefined : input.description,
      sortOrder: input.sortOrder ?? undefined,
    },
  })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: meeting.id,
    action: 'UPDATE',
    meta: {
      type: 'AGENDA_ITEM_UPDATE',
      agendaItemId: updated.id,
      title: updated.title,
    },
  })

  return updated
}

export async function reorderAgendaItems(
  officeId: string,
  userId: string,
  rawInput: ReorderAgendaItemsInput,
) {
  const input = reorderAgendaItemsSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada y no admite reordenación.')
  }

  const updates = input.items.map((item) =>
    prisma.agendaItem.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder },
    }),
  )

  await prisma.$transaction(updates)

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: meeting.id,
    action: 'UPDATE',
    meta: {
      type: 'AGENDA_ITEM_REORDER',
      itemsCount: input.items.length,
    },
  })

  return true
}

export async function deleteAgendaItem(
  officeId: string,
  userId: string,
  rawInput: DeleteAgendaItemInput,
) {
  const input = deleteAgendaItemSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada.')
  }

  const deleted = await prisma.agendaItem.deleteMany({
    where: { id: input.agendaItemId, meetingId: meeting.id },
  })

  if (deleted.count > 0) {
    await logAudit({
      officeId,
      userId,
      entityType: 'MEETING',
      entityId: meeting.id,
      action: 'UPDATE',
      meta: {
        type: 'AGENDA_ITEM_DELETE',
        agendaItemId: input.agendaItemId,
      },
    })
  }

  return deleted
}

export async function recordAttendance(
  officeId: string,
  userId: string,
  rawInput: RecordAttendanceInput,
) {
  const input = recordAttendanceSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada y no admite nuevas asistencias.')
  }

  const attendance = await prisma.attendance.create({
    data: {
      meetingId: meeting.id,
      ownerId: input.ownerId,
      unitId: input.unitId,
      attendeeName: input.attendeeName,
      coefficientPresent: input.coefficientPresent,
      attendanceType: input.attendanceType,
    },
  })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: meeting.id,
    action: 'UPDATE',
    meta: {
      type: 'ATTENDANCE_RECORD',
      attendanceId: attendance.id,
      attendeeName: attendance.attendeeName,
    },
  })

  return attendance
}

export async function deleteAttendance(
  officeId: string,
  userId: string,
  rawInput: DeleteAttendanceInput,
) {
  const input = deleteAttendanceSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada.')
  }

  const deleted = await prisma.attendance.deleteMany({
    where: { id: input.attendanceId, meetingId: meeting.id },
  })

  if (deleted.count > 0) {
    await logAudit({
      officeId,
      userId,
      entityType: 'MEETING',
      entityId: meeting.id,
      action: 'UPDATE',
      meta: {
        type: 'ATTENDANCE_DELETE',
        attendanceId: input.attendanceId,
      },
    })
  }

  return deleted
}

export async function recordVote(officeId: string, userId: string, rawInput: RecordVoteInput) {
  const input = recordVoteSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada y no admite nuevos votos.')
  }

  const vote = await prisma.vote.create({
    data: {
      agendaItemId: input.agendaItemId,
      ownerId: input.ownerId ?? null,
      unitId: input.unitId ?? null,
      vote: input.vote,
      coefficientWeight: input.coefficientWeight,
    },
  })

  await logAudit({
    officeId,
    userId,
    entityType: 'MEETING',
    entityId: meeting.id,
    action: 'UPDATE',
    meta: {
      type: 'VOTE_RECORD',
      voteId: vote.id,
      agendaItemId: input.agendaItemId,
    },
  })

  return vote
}

export async function deleteVote(officeId: string, userId: string, rawInput: DeleteVoteInput) {
  const input = deleteVoteSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  if (meeting.status === 'CLOSED') {
    throw new Error('La reunión está cerrada.')
  }

  const deleted = await prisma.vote.deleteMany({
    where: { id: input.voteId, agendaItem: { meetingId: meeting.id } },
  })

  if (deleted.count > 0) {
    await logAudit({
      officeId,
      userId,
      entityType: 'MEETING',
      entityId: meeting.id,
      action: 'UPDATE',
      meta: { type: 'VOTE_DELETE', voteId: input.voteId },
    })
  }

  return deleted
}

export async function generateMinuteDraft(
  officeId: string,
  userId: string,
  rawInput: GenerateMinuteDraftInput,
) {
  const input = generateMinuteDraftSchema.parse(rawInput)
  const meeting = await requireMeetingInOffice(officeId, input.meetingId)

  const fullMeeting = await prisma.meeting.findUnique({
    where: { id: meeting.id },
    include: {
      attendances: true,
      agendaItems: {
        include: { votes: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!fullMeeting) {
    throw new Error('Reunión no encontrada.')
  }

  const dateStr = fullMeeting.scheduledAt.toLocaleString('es-ES')
  let content = `ACTA DE REUNIÓN ${fullMeeting.meetingType === 'ORDINARY' ? 'ORDINARIA' : 'EXTRAORDINARIA'}\n`
  content += `Comunidad: ${meeting.community.name}\n`
  content += `Fecha: ${dateStr}\n`
  content += `Lugar: ${fullMeeting.location ?? 'No especificado'}\n\n`

  content += `ASISTENTES:\n`
  if (fullMeeting.attendances.length === 0) {
    content += `- Sin asistentes registrados.\n`
  } else {
    for (const att of fullMeeting.attendances) {
      content += `- ${att.attendeeName} (${att.attendanceType}) - Coef: ${att.coefficientPresent}\n`
    }
  }

  content += `\nORDEN DEL DÍA Y ACUERDOS:\n`
  if (fullMeeting.agendaItems.length === 0) {
    content += `- Sin puntos en el orden del día.\n`
  } else {
    for (const item of fullMeeting.agendaItems) {
      content += `\n${item.sortOrder}. ${item.title}\n`
      if (item.description) content += `   ${item.description}\n`
      const votesFor = item.votes.filter(v => v.vote === 'FOR').length
      const votesAgainst = item.votes.filter(v => v.vote === 'AGAINST').length
      const votesAbstain = item.votes.filter(v => v.vote === 'ABSTAIN').length
      content += `   Votos: A favor: ${votesFor}, En contra: ${votesAgainst}, Abstenciones: ${votesAbstain}\n`
    }
  }

  content += `\nCon la firma de los asistentes se da por concluida la reunión.\n`

  return { content, meetingId: meeting.id }
}
