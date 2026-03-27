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
  return listMeetingsPageByOffice(session.officeId, filters, pagination)
}

export async function getMeetingDetailQuery(meetingId: string) {
  const session = await requireMeetingsReadAccess()
  return findMeetingByIdForOffice(meetingId, session.officeId)
}

export async function listMeetingCommunitiesQuery() {
  const session = await requireMeetingsReadAccess()
  return listMeetingCommunitiesByOffice(session.officeId)
}
