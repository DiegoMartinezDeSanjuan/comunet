import { describe, it, expect, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    community: {
      findMany: vi.fn(),
    },
    debt: {
      groupBy: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

import { getDebtByCommunityReport } from '@/modules/reports/server/queries'

describe('Reports Aggregations', () => {
  it('combines community counts and debt sums correctly', async () => {
    mockPrisma.community.findMany.mockResolvedValueOnce([
      { id: 'comm-1', name: 'Edificio A', _count: { debts: 3 } },
      { id: 'comm-2', name: 'Residencial B', _count: { debts: 0 } },
    ])

    mockPrisma.debt.groupBy.mockResolvedValueOnce([
      { communityId: 'comm-1', _sum: { principal: 500, surcharge: 50 } },
      // comm-2 has no debt entries returned in groupBy
    ])

    const result = await getDebtByCommunityReport('office-1')

    expect(result.length).toBe(2)
    // comm-1 has 550 debt
    expect(result[0].communityId).toBe('comm-1')
    expect(result[0].totalDebt).toBe(550)
    expect(result[0].debtorsCount).toBe(3)
    
    // comm-2 has 0 debt
    expect(result[1].communityId).toBe('comm-2')
    expect(result[1].totalDebt).toBe(0)
    expect(result[1].debtorsCount).toBe(0)
  })
})
