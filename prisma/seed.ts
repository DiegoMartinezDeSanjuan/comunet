import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const passwordHash = await bcrypt.hash('Demo1234!', 12)
  // 0. Clean old data
  await prisma.auditLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.debt.deleteMany()
  await prisma.receipt.deleteMany()
  await prisma.budgetLine.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.feeRule.deleteMany()
  await prisma.incidentComment.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.document.deleteMany()
  await prisma.agendaItem.deleteMany()
  await prisma.meeting.deleteMany()
  await prisma.boardPosition.deleteMany()
  await prisma.ownership.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.building.deleteMany()
  await prisma.community.deleteMany()
  await prisma.user.deleteMany()
  await prisma.owner.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.office.deleteMany()

  // 1. Office
  const office = await prisma.office.create({
    data: {
      name: 'Fincas Martínez',
      slug: 'fincas-martinez',
      nif: 'B12345678',
      email: 'admin@fincasmartinez.es',
      phone: '912345678',
      address: 'Calle Gran Vía 12, 28013 Madrid',
    },
  })
  console.log('✅ Office created')

  // 2. Communities
  const community1 = await prisma.community.create({
    data: {
      officeId: office.id,
      name: 'Edificio Los Pinos',
      cif: 'H87654321',
      address: 'Calle de los Pinos 45, 28020 Madrid',
      iban: 'ES9121000418401234567890',
      fiscalYear: 2024,
    },
  })

  // 3. Buildings & Units
  const building1 = await prisma.building.create({
    data: {
      communityId: community1.id,
      name: 'Bloque A',
    },
  })

  const unit1 = await prisma.unit.create({
    data: {
      communityId: community1.id,
      buildingId: building1.id,
      reference: '1A',
      type: 'APARTMENT',
      floor: '1',
      door: 'A',
      areaM2: 95.5,
      coefficient: 0.05,
      quotaPercent: 5.0,
    },
  })

  const unit2 = await prisma.unit.create({
    data: {
      communityId: community1.id,
      buildingId: building1.id,
      reference: '1B',
      type: 'APARTMENT',
      floor: '1',
      door: 'B',
      areaM2: 120.0,
      coefficient: 0.08,
      quotaPercent: 8.0,
    },
  })
  console.log('✅ Communities and units created')

  // 4. Owners & Tenants
  const owner1 = await prisma.owner.create({
    data: {
      officeId: office.id,
      fullName: 'Carlos García López',
      dni: '12345678A',
      email: 'carlos@example.com',
      phone: '600111222',
    },
  })

  const owner2 = await prisma.owner.create({
    data: {
      officeId: office.id,
      fullName: 'María Martínez Torres',
      dni: '87654321B',
      email: 'propietario@comunet.test',
      phone: '600333444',
    },
  })

  await prisma.ownership.create({
    data: {
      unitId: unit1.id,
      ownerId: owner1.id,
      ownershipPercent: 100,
      isPrimaryBillingContact: true,
    },
  })

  await prisma.ownership.create({
    data: {
      unitId: unit2.id,
      ownerId: owner2.id,
      ownershipPercent: 100,
      isPrimaryBillingContact: true,
    },
  })

  // Set María as President
  await prisma.boardPosition.create({
    data: {
      communityId: community1.id,
      ownerId: owner2.id,
      role: 'PRESIDENT',
    },
  })
  console.log('✅ Owners and board created')

  // 5. Providers
  const provider1 = await prisma.provider.create({
    data: {
      officeId: office.id,
      name: 'Fontanería Rápida 24h',
      cif: 'B99887766',
      email: 'contacto@fontaneriarapida.es',
      category: 'Fontanería',
    },
  })

  // 6. Users (Backoffice & Portal)
  await prisma.user.create({
    data: {
      officeId: office.id,
      name: 'Admin Fincas',
      email: 'admin@fincasmartinez.es',
      passwordHash,
      role: 'OFFICE_ADMIN',
    },
  })

  await prisma.user.create({
    data: {
      officeId: office.id,
      name: 'María Martínez (Presidenta)',
      email: 'propietario@comunet.test',
      passwordHash,
      role: 'PRESIDENT',
      linkedOwnerId: owner2.id,
    },
  })
  console.log('✅ Users created')

  // 7. Finance (Budget, Rules, Receipts, Payments, and Debt)
  const budget = await prisma.budget.create({
    data: {
      communityId: community1.id,
      year: 2024,
      totalAmount: 12000,
      status: 'APPROVED',
      lines: {
        create: [
          { concept: 'Limpieza', amount: 4000, category: 'Mantenimiento' },
          { concept: 'Ascensor', amount: 3000, category: 'Mantenimiento' },
          { concept: 'Seguro', amount: 1500, category: 'Administración' },
          { concept: 'Administración', amount: 3500, category: 'Administración' },
        ],
      },
    },
  })

  const rule = await prisma.feeRule.create({
    data: {
      communityId: community1.id,
      name: 'Cuota Ordinaria 2024',
      frequency: 'MONTHLY',
      startDate: new Date('2024-01-01'),
      calculationBase: 'COEFFICIENT',
      fixedAmount: 12000,
      active: true,
    }
  })

  // Unit 1 receives overdue receipt
  const receipt1 = await prisma.receipt.create({
    data: {
      communityId: community1.id,
      unitId: unit1.id,
      ownerId: owner1.id,
      periodStart: new Date('2024-03-01'),
      periodEnd: new Date('2024-03-31'),
      issueDate: new Date('2024-02-25'),
      dueDate: new Date('2024-03-05'),
      amount: 100, // 12000 * 0.05 / 12 months = 50. But for demo let's put 100
      status: 'OVERDUE',
      reference: 'REC-2024-000001',
    },
  })

  // Unit 2 receives paid receipt
  const receipt2 = await prisma.receipt.create({
    data: {
      communityId: community1.id,
      unitId: unit2.id,
      ownerId: owner2.id,
      periodStart: new Date('2024-03-01'),
      periodEnd: new Date('2024-03-31'),
      issueDate: new Date('2024-02-25'),
      dueDate: new Date('2024-03-05'),
      amount: 160,
      paidAmount: 160,
      status: 'PAID',
      reference: 'REC-2024-000002',
    },
  })

  await prisma.payment.create({
    data: {
      receiptId: receipt2.id,
      amount: 160,
      paymentDate: new Date('2024-03-04'),
      method: 'BANK_TRANSFER',
      reference: 'TRF-DEMO-991'
    }
  })

  await prisma.debt.create({
    data: {
      communityId: community1.id,
      unitId: unit1.id,
      ownerId: owner1.id,
      receiptId: receipt1.id,
      principal: 100,
      status: 'PENDING',
    },
  })

  console.log('✅ Finance data created')

  // 8. Incidents
  await prisma.incident.create({
    data: {
      communityId: community1.id,
      createdByUserId: (await prisma.user.findFirst({ where: { role: 'PRESIDENT' } }))!.id,
      title: 'Humedad en el garaje',
      description: 'Hay una filtración de agua en la plaza 14',
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedProviderId: provider1.id,
      comments: {
        create: [
          {
            authorUserId: (await prisma.user.findFirst({ where: { role: 'OFFICE_ADMIN' } }))!.id,
            body: 'He avisado al fontanero para que revise mañana',
          },
        ],
      },
    },
  })

  // 9. Meetings
  await prisma.meeting.create({
    data: {
      communityId: community1.id,
      title: 'Junta Ordinaria 2024',
      scheduledAt: new Date('2024-04-15T18:00:00Z'),
      status: 'SCHEDULED',
      location: 'Portal del edificio',
      agendaItems: {
        create: [
          { title: 'Lectura acta anterior', sortOrder: 1 },
          { title: 'Aprobación cuentas 2023', sortOrder: 2 },
          { title: 'Presupuesto 2024', sortOrder: 3 },
          { title: 'Ruegos y preguntas', sortOrder: 4 },
        ],
      },
    },
  })

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
