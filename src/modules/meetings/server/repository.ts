import 'server-only'

import type { MeetingStatus, MeetingType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type MeetingListFilters = {
  search?: string
  communityId?: string
  status?: MeetingStatus
  meetingType?: MeetingType
  timeframe?: 'upcoming' | 'past'
}

export type PaginationInput = {
  page?: number
  pageSize?: number
}

function normalizePagination(input: PaginationInput = {}) {
  const rawPage = Number(input.page ?? 1)
  const rawPageSize = Number(input.pageSize ?? 20)

  return {
    page: Math.max(1, Math.trunc(Number.isFinite(rawPage) ? rawPage : 1)),
    pageSize: Math.min(100, Math.max(1, Math.trunc(Number.isFinite(rawPageSize) ? rawPageSize : 20))),
  }
}

function buildMeetingWhere(officeId: string, filters: MeetingListFilters = {}): Prisma.MeetingWhereInput {
  const where: Prisma.MeetingWhereInput = {
    community: {
      officeId,
      archivedAt: null,
    },
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { community: { name: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  if (filters.communityId) where.communityId = filters.communityId
  if (filters.status) where.status = filters.status
  if (filters.meetingType) where.meetingType = filters.meetingType

  if (filters.timeframe === 'upcoming') {
    where.scheduledAt = { gte: new Date() }
  } else if (filters.timeframe === 'past') {
    where.scheduledAt = { lt: new Date() }
  }

  return where
}

export async function listMeetingsPageByOffice(
  officeId: string,
  filters: MeetingListFilters = {},
  pagination: PaginationInput = {},
) {
  const { page: requestedPage, pageSize } = normalizePagination(pagination)
  const where = buildMeetingWhere(officeId, filters)

  const total = await prisma.meeting.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const skip = (page - 1) * pageSize

  const items = await prisma.meeting.findMany({
    where,
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      minutes: {
        select: {
          id: true,
          status: true,
          approvedAt: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
      _count: {
        select: {
          agendaItems: true,
          attendances: true,
        },
      },
    },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: pageSize,
  })

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  }
}

export async function findMeetingByIdForOffice(meetingId: string, officeId: string) {
  return prisma.meeting.findFirst({
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
        },
      },
      agendaItems: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          votes: {
            include: {
              owner: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  reference: true,
                },
              },
            },
            orderBy: [{ id: 'asc' }],
          },
        },
      },
      attendances: {
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
          unit: {
            select: {
              id: true,
              reference: true,
            },
          },
        },
        orderBy: [{ attendeeName: 'asc' }],
      },
      minutes: {
        orderBy: [{ createdAt: 'desc' }],
      },
    },
  })
}

export async function findMeetingForWrite(meetingId: string, officeId: string) {
  return prisma.meeting.findFirst({
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
          officeId: true,
          name: true,
        },
      },
      minutes: {
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  })
}

export async function listMeetingCommunitiesByOffice(officeId: string) {
  return prisma.community.findMany({
    where: {
      officeId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: [{ name: 'asc' }],
  })
}
