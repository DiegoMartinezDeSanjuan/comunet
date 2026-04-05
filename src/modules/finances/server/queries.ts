import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import {
    listCommunityOptionsForOffice,
    listCommunityBudgetOptionsForOffice,
} from '@/modules/communities/server/repository'
import { findFeeRulesByOffice } from './fee-rule-repository'
import {
    findReceiptsPageByOffice,
    findReceiptById,
    type ReceiptFilters,
} from './receipt-repository'
import { findBudgetsByOffice } from './budget-repository'

/* ─── Types ──────────────────────────────────────────────────── */

export type FeeRuleOption = {
    id: string
    communityId: string
    name: string
    calculationBase: string | null
    fixedAmount: number | null
}

export type { ReceiptFilters }

/* ─── Private helpers ────────────────────────────────────────── */

async function requireFinancesReadAccess() {
    const session = await requireAuth()

    if (!requirePermission(session, 'finances.read')) {
        throw new Error('FORBIDDEN')
    }

    return session
}

async function requireFinancesManageAccess() {
    const session = await requireAuth()

    if (!requirePermission(session, 'finances.manage')) {
        throw new Error('FORBIDDEN')
    }

    return session
}

/* ─── Public queries ─────────────────────────────────────────── */

/**
 * Everything the "Generate Receipts" form needs:
 * communities dropdown + fee rules.
 */
export async function getReceiptGenerationFormDataQuery() {
    const session = await requireFinancesManageAccess()

    const [communities, feeRulesRaw] = await Promise.all([
        listCommunityOptionsForOffice(session.officeId),
        findFeeRulesByOffice(session.officeId),
    ])

    const feeRules: FeeRuleOption[] = feeRulesRaw.map((rule) => ({
        id: rule.id,
        communityId: rule.communityId,
        name: rule.name,
        calculationBase: rule.calculationBase,
        fixedAmount: rule.fixedAmount == null ? null : Number(rule.fixedAmount),
    }))

    return { communities, feeRules }
}

/**
 * Everything the "New Budget" form needs:
 * communities dropdown with fiscalYear.
 */
export async function getBudgetFormDataQuery() {
    const session = await requireFinancesManageAccess()

    const communities = await listCommunityBudgetOptionsForOffice(session.officeId)

    return { communities }
}

/**
 * Receipts list page — resolves auth + delegates to repository.
 */
export async function listReceiptsPageQuery(
    filters: ReceiptFilters = {},
    pagination: { page?: number; pageSize?: number } = {},
) {
    const session = await requireFinancesReadAccess()

    return findReceiptsPageByOffice(session.officeId, filters, pagination)
}

/**
 * Receipt detail page — resolves auth + verifies the receipt belongs
 * to the user's office.
 */
export async function getReceiptDetailQuery(receiptId: string) {
    const session = await requireFinancesReadAccess()

    const receipt = await findReceiptById(receiptId)

    if (!receipt || receipt.community.officeId !== session.officeId) {
        return null
    }

    return { receipt, session }
}

/**
 * Budgets list page — resolves auth + returns all budgets for the office.
 */
export async function listBudgetsQuery() {
    const session = await requireFinancesReadAccess()

    const budgets = await findBudgetsByOffice(session.officeId)

    return { budgets, session }
}

