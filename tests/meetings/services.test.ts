import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = {
  meeting: {
    findFirst: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/modules/audit/server/services', () => ({
  logAudit: vi.fn(),
}))

import { generateMinuteDraft } from '@/modules/meetings/server/services'

describe('meetings slice 2.5 - services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('generates a draft minute based on meeting data', async () => {
    mockPrisma.meeting.findFirst.mockResolvedValueOnce({
      id: 'meeting-1',
      title: 'Junta Ordinaria',
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

    expect(draft.content).toContain('ACTA DE REUNIÓN: Junta Ordinaria')
    expect(draft.content).toContain('Comunidad Test')
    expect(draft.content).toContain('Test Owner (IN_PERSON)')
    expect(draft.content).toContain('1. Aprobación cuentas')
    expect(draft.content).toContain('Votos: A favor: 1, En contra: 0, Abstenciones: 0')
  })

  it('rejects generating draft if meeting not found', async () => {
    mockPrisma.meeting.findFirst.mockResolvedValueOnce(null)

    await expect(
      generateMinuteDraft('office-1', 'user-1', { meetingId: 'meeting-invalid' })
    ).rejects.toThrow('Reunión no encontrada')
  })
})
