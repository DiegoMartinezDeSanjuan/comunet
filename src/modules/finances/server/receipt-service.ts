import 'server-only'
import * as repo from './receipt-repository'
import { generateReceiptsSchema, type GenerateReceiptsInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { refreshDebtProjectionService } from './debt-service'
import { prisma } from '@/lib/db'

function generateReceiptReference(communityId: string, unitId: string, periodStart: Date) {
  const c = communityId.substring(0, 4).toUpperCase()
  const u = unitId.substring(0, 4).toUpperCase()
  const dateStr = periodStart.toISOString().substring(0, 10).replace(/-/g, '')
  const rnd = Math.random().toString(16).substring(2, 6).toUpperCase()
  return `REC-${c}-${u}-${dateStr}-${rnd}`
}

export async function generateReceiptsService(officeId: string, userId: string, data: GenerateReceiptsInput) {
  const valid = generateReceiptsSchema.parse(data)

  const community = await prisma.community.findFirst({
    where: { id: valid.communityId, officeId },
  })

  if (!community) throw new Error('Comunidad no encontrada o sin acceso')

  const rule = await prisma.feeRule.findFirst({
    where: {
      id: valid.feeRuleId,
      communityId: valid.communityId,
      community: { officeId },
      active: true,
    },
  })

  if (!rule) {
    throw new Error('Regla de cuota no encontrada, inactiva o no pertenece a la comunidad')
  }

  const units = await prisma.unit.findMany({
    where: { communityId: valid.communityId, active: true },
    include: {
      ownerships: {
        include: { owner: true },
      },
    },
  })

  if (units.length === 0) throw new Error('No hay unidades activas en la comunidad')

  const periodStart = new Date(valid.periodStart)
  const periodEnd = new Date(valid.periodEnd)
  const issueDate = new Date(valid.issueDate)
  const dueDate = new Date(valid.dueDate)

  const existingRecords = await repo.getExistingReceiptsForPeriod(valid.communityId, periodStart, periodEnd)
  const existingUnitIds = new Set(existingRecords.map((r: { unitId: string }) => r.unitId))

  const receiptsToCreate: Array<{
    communityId: string
    unitId: string
    ownerId: string
    periodStart: Date
    periodEnd: Date
    issueDate: Date
    dueDate: Date
    amount: number
    paidAmount: number
    status: 'ISSUED'
    reference: string
  }> = []

  for (const unit of units) {
    if (existingUnitIds.has(unit.id)) continue

    const targetOwner =
      unit.ownerships.find((o) => o.isPrimaryBillingContact)?.owner ||
      unit.ownerships[0]?.owner

    if (!targetOwner) continue

    let amount = 0
    const fixed = Number(rule.fixedAmount || 0)

    if (rule.calculationBase === 'FIXED') {
      amount = fixed
    } else if (rule.calculationBase === 'COEFFICIENT') {
      const coef = Number(unit.coefficient || 0)
      amount = fixed * (coef / 100)
    } else if (rule.calculationBase === 'QUOTA_PERCENT') {
      const quota = Number(unit.quotaPercent || 0)
      amount = fixed * (quota / 100)
    }

    if (amount <= 0) continue

    receiptsToCreate.push({
      communityId: valid.communityId,
      unitId: unit.id,
      ownerId: targetOwner.id,
      periodStart,
      periodEnd,
      issueDate,
      dueDate,
      amount,
      paidAmount: 0,
      status: 'ISSUED',
      reference: generateReceiptReference(valid.communityId, unit.id, periodStart),
    })
  }

  if (receiptsToCreate.length === 0) {
    return {
      count: 0,
      message: 'No se generó ningún recibo (posibles duplicados o unidades sin propietario/importe nulo)',
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.receipt.createMany({
      data: receiptsToCreate,
    })
  })

  await refreshDebtProjectionService(valid.communityId)

  logAudit({
    officeId,
    userId,
    entityType: 'Receipt',
    entityId: receiptsToCreate[0].reference,
    action: 'CREATE',
    meta: {
      batchCount: receiptsToCreate.length,
      periodStart: valid.periodStart,
      communityId: valid.communityId,
    },
  })

  return {
    count: receiptsToCreate.length,
    message: `Se generaron ${receiptsToCreate.length} recibos con éxito.`,
  }
}

export async function markReceiptReturnedService(id: string, officeId: string, userId: string) {
  const receipt = await repo.findReceiptById(id)

  if (!receipt || receipt.community.officeId !== officeId) {
    throw new Error('Recibo no encontrado o sin acceso')
  }

  if (receipt.status !== 'PAID' && receipt.status !== 'PARTIALLY_PAID') {
    throw new Error('Solo se pueden devolver recibos cobrados')
  }

  const updated = await repo.markReceiptStatus(id, 'RETURNED')
  await refreshDebtProjectionService(updated.communityId)

  logAudit({
    officeId,
    userId,
    entityType: 'Receipt',
    entityId: id,
    action: 'STATUS_CHANGE',
    meta: { status: 'RETURNED' },
  })

  return updated
}

export async function markReceiptCancelledService(id: string, officeId: string, userId: string) {
  const receipt = await repo.findReceiptById(id)

  if (!receipt || receipt.community.officeId !== officeId) {
    throw new Error('Recibo no encontrado o sin acceso')
  }

  const updated = await repo.markReceiptStatus(id, 'CANCELLED')
  await refreshDebtProjectionService(updated.communityId)

  logAudit({
    officeId,
    userId,
    entityType: 'Receipt',
    entityId: id,
    action: 'STATUS_CHANGE',
    meta: { status: 'CANCELLED' },
  })

  return updated
}
