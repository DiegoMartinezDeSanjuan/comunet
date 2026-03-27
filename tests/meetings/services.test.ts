import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    meeting: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/modules/audit/server/services', () => ({
  logAudit: vi.fn(),
}))

// Mock schema to use simple string validation instead of .cuid()
// which has CJS/ESM resolution mismatch in vitest with Zod v4
vi.mock('@/modules/meetings/schema', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  return {
    ...original,
    generateMinuteDraftSchema: z.object({
      meetingId: z.string().min(1),
    }),
  }
})

import { generateMinuteDraft } from '@/modules/meetings/server/services'

describe('meetings slice 2.5 - services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('generates a draft minute based on meeting data', async () => {
    // requireMeetingInOffice calls findFirst with include: { community, minutes }
    mockPrisma.meeting.findFirst.mockResolvedValueOnce({
      id: 'meeting-1',
      communityId: 'comm-1',
      community: { id: 'comm-1', name: 'Comunidad Test', officeId: 'office-1' },
      minutes: [],
    })

    // generateMinuteDraft then calls findUnique for full meeting data
    mockPrisma.meeting.findUnique.mockResolvedValueOnce({
      id: 'meeting-1',
      title: 'Junta Ordinaria',
      meetingType: 'ORDINARY',
      location: 'Portal',
      scheduledAt: new Date('2026-04-15T18:00:00Z'),
      community: { name: 'Comunidad Test' },
      attendances: [
        { attendeeName: 'Test Owner', attendanceType: 'IN_PERSON', coefficientPresent: 50 },
      ],
      agendaItems: [
        {
          id: 'agenda-1',
          title: 'Aprobación cuentas',
          sortOrder: 1,
          votes: [
            { vote: 'FOR', coefficientWeight: 50 },
          ],
        },
      ],
    })

    const draft = await generateMinuteDraft('office-1', 'user-1', { meetingId: 'meeting-1' })

    expect(draft.content).toContain('ACTA DE REUNIÓN ORDINARIA')
    expect(draft.content).toContain('Comunidad Test')
    expect(draft.content).toContain('Test Owner (IN_PERSON)')
    expect(draft.content).toContain('Aprobación cuentas')
  })

  it('rejects generating draft if meeting not found', async () => {
    mockPrisma.meeting.findFirst.mockResolvedValueOnce(null)

    await expect(
      generateMinuteDraft('office-1', 'user-1', { meetingId: 'meeting-invalid' })
    ).rejects.toThrow('La reunión no existe o no pertenece al despacho.')
  })
})
