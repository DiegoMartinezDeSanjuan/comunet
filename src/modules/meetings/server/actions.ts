'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import type {
  AddAgendaItemInput,
  ChangeMeetingStatusInput,
  CreateMeetingInput,
  SaveMeetingMinuteInput,
  UpdateMeetingInput,
  UpdateAgendaItemInput,
  ReorderAgendaItemsInput,
  DeleteAgendaItemInput,
  RecordAttendanceInput,
  DeleteAttendanceInput,
  RecordVoteInput,
  DeleteVoteInput,
  GenerateMinuteDraftInput,
} from '@/modules/meetings/schema'
import {
  addAgendaItem,
  changeMeetingStatus,
  createMeeting,
  saveMeetingMinute,
  updateMeeting,
  updateAgendaItem,
  reorderAgendaItems,
  deleteAgendaItem,
  recordAttendance,
  deleteAttendance,
  recordVote,
  deleteVote,
  generateMinuteDraft,
} from './services'

async function getOfficeAndUser(permission: string) {
  const session = await requireAuth()
  if (!requirePermission(session, permission)) {
    throw new Error('FORBIDDEN')
  }
  return { officeId: session.officeId, userId: session.userId }
}

export async function createMeetingAction(input: CreateMeetingInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const meeting = await createMeeting(officeId, userId, input)
  revalidatePath('/meetings')
  revalidatePath('/dashboard')
  revalidatePath(`/communities/${meeting.communityId}`)
  revalidatePath('/portal/meetings')
  return meeting
}

export async function updateMeetingAction(meetingId: string, input: UpdateMeetingInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const meeting = await updateMeeting(officeId, userId, meetingId, input)
  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meeting.id}`)
  revalidatePath('/dashboard')
  revalidatePath('/portal/meetings')
  return meeting
}

export async function addAgendaItemAction(input: AddAgendaItemInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const agendaItem = await addAgendaItem(officeId, userId, input)
  revalidatePath('/meetings')
  revalidatePath(`/meetings/${agendaItem.meetingId}`)
  return agendaItem
}

export async function changeMeetingStatusAction(input: ChangeMeetingStatusInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const meeting = await changeMeetingStatus(officeId, userId, input)
  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meeting.id}`)
  revalidatePath('/dashboard')
  revalidatePath('/portal/meetings')
  return meeting
}

export async function saveMeetingMinuteAction(input: SaveMeetingMinuteInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const minute = await saveMeetingMinute(officeId, userId, input)
  revalidatePath('/meetings')
  revalidatePath(`/meetings/${minute.meetingId}`)
  revalidatePath('/portal/meetings')
  return minute
}

export async function updateAgendaItemAction(input: UpdateAgendaItemInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const agendaItem = await updateAgendaItem(officeId, userId, input)
  revalidatePath(`/meetings/${agendaItem.meetingId}`)
  return agendaItem
}

export async function reorderAgendaItemsAction(input: ReorderAgendaItemsInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  await reorderAgendaItems(officeId, userId, input)
  revalidatePath(`/meetings/${input.meetingId}`)
  return true
}

export async function deleteAgendaItemAction(input: DeleteAgendaItemInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  await deleteAgendaItem(officeId, userId, input)
  revalidatePath(`/meetings/${input.meetingId}`)
  return true
}

export async function recordAttendanceAction(input: RecordAttendanceInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const attendance = await recordAttendance(officeId, userId, input)
  revalidatePath(`/meetings/${attendance.meetingId}`)
  return attendance
}

export async function deleteAttendanceAction(input: DeleteAttendanceInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  await deleteAttendance(officeId, userId, input)
  revalidatePath(`/meetings/${input.meetingId}`)
  return true
}

export async function recordVoteAction(input: RecordVoteInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const vote = await recordVote(officeId, userId, input)
  revalidatePath(`/meetings/${input.meetingId}`)
  return vote
}

export async function deleteVoteAction(input: DeleteVoteInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  await deleteVote(officeId, userId, input)
  revalidatePath(`/meetings/${input.meetingId}`)
  return true
}

export async function generateMinuteDraftAction(input: GenerateMinuteDraftInput) {
  const { officeId, userId } = await getOfficeAndUser('meetings.manage')
  const draft = await generateMinuteDraft(officeId, userId, input)
  return draft
}
