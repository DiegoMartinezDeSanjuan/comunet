import 'server-only'

import { paymentSchema, type PaymentInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { refreshDebtProjectionService } from './debt-service'
import { prisma } from '@/lib/db'

export async function registerPaymentService(
  officeId: string,
  userId: string,
  data: PaymentInput,
) {
  const valid = paymentSchema.parse(data)

  const receipt = await prisma.receipt.findFirst({
    where: {
      id: valid.receiptId,
      community: { officeId },
    },
  })

  if (!receipt) throw new Error('Recibo no encontrado')
  if (receipt.status === 'CANCELLED') {
    throw new Error('No se pueden registrar pagos en un recibo cancelado')
  }

  const currentPaid = Number(receipt.paidAmount)
  const totalAmount = Number(receipt.amount)
  const pending = totalAmount - currentPaid

  if (pending <= 0) throw new Error('El recibo ya está totalmente pagado')
  if (valid.amount > pending + 0.01) {
    throw new Error(`El pago excede el importe pendiente (${pending.toFixed(2)}€)`)
  }

  const newPaidAmount = currentPaid + valid.amount
  const newStatus: 'PARTIALLY_PAID' | 'PAID' =
    Math.abs(totalAmount - newPaidAmount) < 0.01 ? 'PAID' : 'PARTIALLY_PAID'

  const { payment, updatedReceipt } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        receiptId: valid.receiptId,
        amount: valid.amount,
        paymentDate: new Date(valid.paymentDate),
        method: valid.method,
        reference: valid.reference ?? undefined,
        notes: valid.notes ?? undefined,
      },
    })

    const updatedReceipt = await tx.receipt.update({
      where: { id: receipt.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    })

    return { payment, updatedReceipt }
  })

  await refreshDebtProjectionService(receipt.communityId)

  await logAudit({
    officeId,
    userId,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'CREATE',
    meta: {
      receiptId: receipt.id,
      amount: valid.amount,
      newStatus,
    },
  })

  return { payment, receipt: updatedReceipt }
}
