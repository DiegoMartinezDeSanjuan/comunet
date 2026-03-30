import type { ReceiptStatus } from '@prisma/client'

/**
 * Computes the effective display status of a receipt.
 * If the receipt is ISSUED and its dueDate has passed, returns 'OVERDUE'.
 * This avoids needing a cron job to update statuses in the database.
 */
export function getEffectiveReceiptStatus(
  status: ReceiptStatus,
  dueDate: Date | string | null,
): ReceiptStatus {
  if (status !== 'ISSUED') return status

  if (!dueDate) return status

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const now = new Date()

  // Compare dates only (ignore time)
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (dueDay < today) {
    return 'OVERDUE'
  }

  return status
}
