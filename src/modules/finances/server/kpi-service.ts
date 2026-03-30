import 'server-only'
import { prisma } from '@/lib/db'

export async function computeFinanceKPIs(communityId: string) {
  // 1. Total Emitido (all receipts except CANCELLED)
  const issuedAgg = await prisma.receipt.aggregate({
    where: {
      communityId,
      status: { not: 'CANCELLED' }
    },
    _sum: { amount: true }
  })
  
  // 2. Total Cobrado (all paid amounts)
  const paidAgg = await prisma.receipt.aggregate({
    where: {
      communityId,
      status: { not: 'CANCELLED' }
    },
    _sum: { paidAmount: true }
  })

  // 3. Total Pendiente (from Debt projection where status is not PAID/WRITTEN_OFF)
  const debtAgg = await prisma.debt.aggregate({
    where: {
      communityId,
      status: { in: ['PENDING', 'PARTIALLY_PAID'] }
    },
    _sum: { principal: true, surcharge: true }
  })

  // 4. Overdue Receipts count (computed: ISSUED + dueDate passed)
  const overdueCount = await prisma.receipt.count({
    where: {
      communityId,
      status: 'ISSUED',
      dueDate: { lt: new Date() },
    }
  })

  const totalEmitido = Number(issuedAgg._sum.amount || 0)
  const totalCobrado = Number(paidAgg._sum.paidAmount || 0)
  const principalPendiente = Number(debtAgg._sum.principal || 0)
  const surchargePendiente = Number(debtAgg._sum.surcharge || 0)

  return {
    totalEmitido,
    totalCobrado,
    totalPendiente: principalPendiente + surchargePendiente,
    overdueCount
  }
}

export async function computeOfficeFinanceKPIs(officeId: string) {
  // 1. Total Emitido
  const issuedAgg = await prisma.receipt.aggregate({
    where: {
      community: { officeId },
      status: { not: 'CANCELLED' }
    },
    _sum: { amount: true }
  })
  
  // 2. Total Cobrado
  const paidAgg = await prisma.receipt.aggregate({
    where: {
      community: { officeId },
      status: { not: 'CANCELLED' }
    },
    _sum: { paidAmount: true }
  })

  // 3. Total Pendiente
  const debtAgg = await prisma.debt.aggregate({
    where: {
      community: { officeId },
      status: { in: ['PENDING', 'PARTIALLY_PAID'] }
    },
    _sum: { principal: true, surcharge: true }
  })

  // 4. Overdue Receipts count (computed: ISSUED + dueDate passed)
  const overdueCount = await prisma.receipt.count({
    where: {
      community: { officeId },
      status: 'ISSUED',
      dueDate: { lt: new Date() },
    }
  })

  const totalEmitido = Number(issuedAgg._sum.amount || 0)
  const totalCobrado = Number(paidAgg._sum.paidAmount || 0)
  const principalPendiente = Number(debtAgg._sum.principal || 0)
  const surchargePendiente = Number(debtAgg._sum.surcharge || 0)

  return {
    totalEmitido,
    totalCobrado,
    totalPendiente: principalPendiente + surchargePendiente,
    overdueCount
  }
}
