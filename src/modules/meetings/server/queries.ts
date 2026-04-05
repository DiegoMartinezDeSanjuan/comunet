import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import {
  findMeetingByIdForOffice,
  listMeetingCommunitiesByOffice,
  listMeetingsPageByOffice,
  type MeetingListFilters,
  type PaginationInput,
} from './repository'

async function requireMeetingsReadAccess() {
  const session = await requireAuth()
  if (!requirePermission(session, 'meetings.read')) {
    throw new Error('FORBIDDEN')
  }
  return session
}

export async function listMeetingsQuery(
  filters: MeetingListFilters = {},
  pagination: PaginationInput = {},
) {
  const session = await requireMeetingsReadAccess()
  const result = await listMeetingsPageByOffice(session.officeId, filters, pagination)
  return { ...result, session }
}

export async function getMeetingDetailQuery(meetingId: string) {
  const session = await requireMeetingsReadAccess()
  const meeting = await findMeetingByIdForOffice(meetingId, session.officeId)
  return { meeting, session }
}

export async function listMeetingCommunitiesQuery() {
  const session = await requireMeetingsReadAccess()
  return listMeetingCommunitiesByOffice(session.officeId)
}
