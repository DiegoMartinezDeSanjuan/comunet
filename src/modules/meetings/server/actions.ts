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
} from '@/modules/meetings/schema'
import {
  addAgendaItem,
  changeMeetingStatus,
  createMeeting,
  saveMeetingMinute,
  updateMeeting,
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
