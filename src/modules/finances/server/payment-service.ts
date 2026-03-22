import 'server-only'
import { paymentSchema, type PaymentInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { refreshDebtProjectionService } from './debt-service'
import { prisma } from '@/lib/db'

export async function registerPaymentService(officeId: string, userId: string, data: PaymentInput) {
  const valid = paymentSchema.parse(data)
  
  // 1. Validate receipt
  const receipt = await prisma.receipt.findUnique({ where: { id: valid.receiptId, community: { officeId } } })
  if (!receipt) throw new Error("Recibo no encontrado")
  if (receipt.status === 'CANCELLED') throw new Error("No se pueden registrar pagos en un recibo cancelado")
  
  const currentPaid = Number(receipt.paidAmount)
  const totalAmount = Number(receipt.amount)
  const pending = totalAmount - currentPaid
  
  if (pending <= 0) throw new Error("El recibo ya está totalmente pagado")
  if (valid.amount > pending + 0.01) { // 0.01 tolerance for floating point weirdness
    throw new Error(`El pago excede el importe pendiente (${pending.toFixed(2)}€)`)
  }

  // 2. Register payment
  const payment = await prisma.payment.create({
    data: {
      receiptId: valid.receiptId,
      amount: valid.amount,
      paymentDate: new Date(valid.paymentDate),
      method: valid.method,
      reference: valid.reference ?? undefined,
      notes: valid.notes ?? undefined,
    }
  })

  // 3. Update Receipt
  const newPaidAmount = currentPaid + valid.amount
  let newStatus: 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID'
  
  // If paid is extremely close to total, consider it fully PAID
  if (Math.abs(totalAmount - newPaidAmount) < 0.01) {
    newStatus = 'PAID'
  }

  const updatedReceipt = await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus
    }
  })

  // 4. Refresh Debt Projection
  await refreshDebtProjectionService(receipt.communityId)

  await logAudit({
    officeId,
    userId,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'CREATE',
    meta: { receiptId: receipt.id, amount: valid.amount, newStatus }
  })

  return { payment, receipt: updatedReceipt }
}
