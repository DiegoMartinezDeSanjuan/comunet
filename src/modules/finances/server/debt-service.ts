import 'server-only'
import { prisma } from '@/lib/db'

/**
 * Recalculates debt based on non-cancelled receipts.
 * This ensures Debt is a strict projection of Receipts and Payments.
 * If communityId is provided, refreshes all debts in that community.
 */
export async function refreshDebtProjectionService(communityId: string) {
  // 1. Get all outstanding (unpaid/partially paid/overdue/returned) receipts
  const activeReceipts = await prisma.receipt.findMany({
    where: {
      communityId,
      status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE', 'RETURNED'] }
    }
  })

  // We want to upsert Debt records to match exactly the Pending amount of these receipts.
  // Receipt pending amount = receipt.amount - receipt.paidAmount

  // We can group by Owner+Unit if we wanted a consolidated debt, or per Receipt.
  // The schema has `receiptId?`, meaning we can track debt per receipt. This is much better for tracing.
  
  // First, find all current Pending/PartiallyPaid debts for this community
  const currentDebts = await prisma.debt.findMany({
    where: {
      communityId,
      status: { in: ['PENDING', 'PARTIALLY_PAID'] }
    }
  })

  const validReceiptIds = new Set(activeReceipts.map(r => r.id))

  // Clear debts for receipts that are no longer outstanding (paid or cancelled)
  for (const debt of currentDebts) {
    if (debt.receiptId && !validReceiptIds.has(debt.receiptId)) {
      await prisma.debt.update({
        where: { id: debt.id },
        data: { status: 'PAID', principal: 0 } // Marked as resolved
      })
    }
  }

  // Upsert debt for each outstanding receipt
  for (const receipt of activeReceipts) {
    const pendingAmount = Number(receipt.amount) - Number(receipt.paidAmount)
    let debtStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' = 'PENDING'
    
    if (pendingAmount <= 0) {
      debtStatus = 'PAID'
    } else if (Number(receipt.paidAmount) > 0) {
      debtStatus = 'PARTIALLY_PAID'
    }

    // Find if a debt already exists for this receipt
    const existingDebt = await prisma.debt.findFirst({
      where: { receiptId: receipt.id }
    })

    if (existingDebt) {
      await prisma.debt.update({
        where: { id: existingDebt.id },
        data: {
          principal: pendingAmount,
          status: debtStatus
        }
      })
    } else {
      if (debtStatus !== 'PAID') {
        await prisma.debt.create({
          data: {
            communityId: receipt.communityId,
            unitId: receipt.unitId,
            ownerId: receipt.ownerId,
            receiptId: receipt.id,
            principal: pendingAmount,
            status: debtStatus
          }
        })
      }
    }
  }

  return true
}
