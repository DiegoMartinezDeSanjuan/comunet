import 'server-only'
import * as repo from './receipt-repository'
import { findFeeRuleById } from './fee-rule-repository'
import { generateReceiptsSchema, type GenerateReceiptsInput } from '../schema'
import { logAudit } from '@/modules/audit/server/services'
import { refreshDebtProjectionService } from './debt-service'
import { prisma } from '@/lib/db'

function generateReceiptReference(communityId: string, unitId: string, periodStart: Date) {
  const c = communityId.substring(0, 4).toUpperCase()
  const u = unitId.substring(0, 4).toUpperCase()
  const dateStr = periodStart.toISOString().substring(0, 10).replace(/-/g, '')
  // Small random hex to guarantee uniqueness internally if everything else fails
  const rnd = Math.random().toString(16).substring(2, 6).toUpperCase()
  return `REC-${c}-${u}-${dateStr}-${rnd}`
}

export async function generateReceiptsService(officeId: string, userId: string, data: GenerateReceiptsInput) {
  const valid = generateReceiptsSchema.parse(data)
  
  // 1. Get Fee Rule
  const rule = await findFeeRuleById(valid.feeRuleId)
  if (!rule || rule.communityId !== valid.communityId || !rule.active) {
    throw new Error("Regla de cuota no encontrada, inactiva o no pertenece a la comunidad")
  }

  // 2. Determine target Units
  const units = await prisma.unit.findMany({
    where: { communityId: valid.communityId, active: true },
    include: {
      ownerships: {
        include: { owner: true }
      }
    }
  })

  if (units.length === 0) throw new Error("No hay unidades activas en la comunidad")

  const periodStart = new Date(valid.periodStart)
  const periodEnd = new Date(valid.periodEnd)
  const issueDate = new Date(valid.issueDate)
  const dueDate = new Date(valid.dueDate)

  // 3. Find already existing receipts for this period to avoid duplicates
  const existingRecords = await repo.getExistingReceiptsForPeriod(valid.communityId, periodStart, periodEnd)
  const existingUnitIds = new Set(existingRecords.map((r: any) => r.unitId))

  const receiptsToCreate: any[] = []
  const generatedReceiptLogKeys = new Set<string>()
  for (const unit of units) {
    if (existingUnitIds.has(unit.id)) continue; // Skip duplicates

    // Find billing owner
    const targetOwner = unit.ownerships.find((o: any) => o.isPrimaryBillingContact)?.owner 
      || unit.ownerships[0]?.owner
    
    if (!targetOwner) continue; // No owner, skip

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

    if (amount <= 0) continue; // Don't generate 0 amount receipts

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
      status: 'ISSUED' as const,
      reference: generateReceiptReference(valid.communityId, unit.id, periodStart)
    })
  }

  if (receiptsToCreate.length === 0) {
    return { count: 0, message: "No se generó ningún recibo (posibles duplicados o unidades sin propietario/importe nulo)" }
  }

  // 5. Bulk Create inside a transaction
  await prisma.$transaction(async (tx: any) => {
    await tx.receipt.createMany({
      data: receiptsToCreate
    })
  })

  // 6. Refresh debts for the newly generated receipts
  // We'll call the debt projection service for this community
  await refreshDebtProjectionService(valid.communityId)

  await logAudit({
    officeId,
    userId,
    entityType: 'Receipt',
    entityId: receiptsToCreate[0].reference, // representative
    action: 'CREATE',
    meta: { 
      batchCount: receiptsToCreate.length, 
      periodStart: valid.periodStart, 
      communityId: valid.communityId 
    }
  })

  return { count: receiptsToCreate.length, message: `Se generaron ${receiptsToCreate.length} recibos con éxito.` }
}

export async function markReceiptReturnedService(id: string, officeId: string, userId: string) {
  const receipt = await repo.findReceiptById(id)
  if (!receipt) throw new Error("Recibo no encontrado")
  
  if (receipt.status !== 'PAID' && receipt.status !== 'PARTIALLY_PAID') {
    throw new Error("Solo se pueden devolver recibos cobrados")
  }

  const updated = await repo.markReceiptStatus(id, 'RETURNED')
  await refreshDebtProjectionService(updated.communityId)

  await logAudit({
    officeId,
    userId,
    entityType: 'Receipt',
    entityId: id,
    action: 'STATUS_CHANGE',
    meta: { status: 'RETURNED' }
  })
  
  return updated
}

export async function markReceiptCancelledService(id: string, officeId: string, userId: string) {
  const receipt = await repo.findReceiptById(id)
  if (!receipt) throw new Error("Recibo no encontrado")

  const updated = await repo.markReceiptStatus(id, 'CANCELLED')
  await refreshDebtProjectionService(updated.communityId)

  await logAudit({
    officeId,
    userId,
    entityType: 'Receipt',
    entityId: id,
    action: 'STATUS_CHANGE',
    meta: { status: 'CANCELLED' }
  })
  
  return updated
}
