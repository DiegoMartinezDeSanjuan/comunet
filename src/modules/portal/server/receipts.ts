import 'server-only'

import type { Prisma, ReceiptStatus } from '@prisma/client'

import { requireAuth, type Session } from '@/lib/auth'

import { getPortalReceiptsDb, getPortalReceiptDetailDb } from './repository'

import {
  canAccessPortalReceiptRecord,
  getPortalAccessScope,
  isPortalOwnerPresidentRole,
} from './policy'
import { buildMonthRange, toNumber } from './utils'

export interface PortalReceiptFilters {
  communityId?: string
  unitId?: string
  status?: ReceiptStatus | string
  period?: string
}

interface NormalizedPortalReceiptFilters {
  communityId?: string
  unitId?: string
  status?: ReceiptStatus
  period?: string
}

const ALLOWED_RECEIPT_STATUSES = new Set<ReceiptStatus>([
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'RETURNED',
  'CANCELLED',
])

function normalizePortalReceiptFilters(
  filters: PortalReceiptFilters = {},
): NormalizedPortalReceiptFilters {
  const normalizedStatus =
    typeof filters.status === 'string' && ALLOWED_RECEIPT_STATUSES.has(filters.status as ReceiptStatus)
      ? (filters.status as ReceiptStatus)
      : undefined

  const normalizedPeriod =
    typeof filters.period === 'string' && /^\d{4}-\d{2}$/.test(filters.period)
      ? filters.period
      : undefined

  return {
    communityId: typeof filters.communityId === 'string' ? filters.communityId : undefined,
    unitId: typeof filters.unitId === 'string' ? filters.unitId : undefined,
    status: normalizedStatus,
    period: normalizedPeriod,
  }
}

function attachReceiptTotals<T extends { amount: unknown; paidAmount: unknown }>(receipt: T) {
  const amountValue = toNumber(receipt.amount)
  const paidAmountValue = toNumber(receipt.paidAmount)

  return {
    ...receipt,
    amountValue,
    paidAmountValue,
    pendingBalance: Math.max(0, amountValue - paidAmountValue),
  }
}

export async function getPortalReceiptsPageQuery(filters: PortalReceiptFilters = {}) {
  const session = await requireAuth()
  const data = await listPortalReceipts(session, filters)
  return { ...data, session }
}

export async function listPortalReceipts(
  session: Session,
  filters: PortalReceiptFilters = {},
) {
  if (!isPortalOwnerPresidentRole(session.role) || !session.linkedOwnerId) {
    return {
      items: [],
      scope: null,
      appliedFilters: normalizePortalReceiptFilters(filters),
      summary: {
        totalCount: 0,
        pendingTotal: 0,
        overdueCount: 0,
      },
    }
  }

  const scope = await getPortalAccessScope(session)
  const appliedFilters = normalizePortalReceiptFilters(filters)

  if (!scope.ownedCommunityIds.length) {
    return {
      items: [],
      scope,
      appliedFilters,
      summary: {
        totalCount: 0,
        pendingTotal: 0,
        overdueCount: 0,
      },
    }
  }

  const where: Prisma.ReceiptWhereInput = {
    ownerId: session.linkedOwnerId,
    community: { officeId: session.officeId },
    communityId: { in: scope.ownedCommunityIds },
  }

  if (appliedFilters.communityId && scope.ownedCommunityIds.includes(appliedFilters.communityId)) {
    where.communityId = appliedFilters.communityId
  }

  if (appliedFilters.unitId && scope.ownedUnitIds.includes(appliedFilters.unitId)) {
    where.unitId = appliedFilters.unitId
  }

  if (appliedFilters.status) {
    where.status = appliedFilters.status
  }

  const monthRange = buildMonthRange(appliedFilters.period)

  if (monthRange) {
    where.periodStart = { gte: monthRange.start }
    where.periodEnd = { lte: monthRange.end }
  }

  const items = await getPortalReceiptsDb(where)

  const normalizedItems = items.map((receipt) => attachReceiptTotals(receipt))

  return {
    items: normalizedItems,
    scope,
    appliedFilters,
    summary: {
      totalCount: normalizedItems.length,
      pendingTotal: normalizedItems.reduce((sum, receipt) => sum + receipt.pendingBalance, 0),
      overdueCount: normalizedItems.filter((receipt) => receipt.status === 'OVERDUE').length,
    },
  }
}

export async function getPortalReceiptDetailPageQuery(receiptId: string) {
  const session = await requireAuth()
  const receipt = await getPortalReceiptDetail(session, receiptId)
  return { receipt, session }
}

export async function getPortalReceiptDetail(session: Session, receiptId: string) {
  const receipt = await getPortalReceiptDetailDb(receiptId)

  if (!receipt) {
    return null
  }

  const allowed = await canAccessPortalReceiptRecord(session, receipt)

  if (!allowed) {
    return null
  }

  const paymentTotal = receipt.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  const debtOutstanding = receipt.debts.reduce(
    (sum, debt) => sum + toNumber(debt.principal) + toNumber(debt.surcharge),
    0,
  )

  return {
    ...attachReceiptTotals(receipt),
    paymentTotal,
    debtOutstanding,
  }
}
