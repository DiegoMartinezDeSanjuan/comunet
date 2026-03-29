import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const passwordHash = await bcrypt.hash('Demo1234!', 12)

  // ── Limpiar ──────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.debt.deleteMany()
  await prisma.receipt.deleteMany()
  await prisma.budgetLine.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.feeRule.deleteMany()
  await prisma.incidentComment.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.document.deleteMany()
  await prisma.vote.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.agendaItem.deleteMany()
  await prisma.meeting.deleteMany()
  await prisma.boardPosition.deleteMany()
  await prisma.ownership.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.building.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.owner.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.community.deleteMany()
  await prisma.office.deleteMany()

  console.log('🧹 Cleared')

  // ── Oficina ──────────────────────────────────────────────────────
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

  // ── Comunidad ─────────────────────────────────────────────────────
  const community = await prisma.community.create({
    data: {
      officeId: office.id,
      name: 'Edificio Los Pinos',
      cif: 'H87654321',
      address: 'Calle de los Pinos 45, 28020 Madrid',
      iban: 'ES9121000418401234567890',
      fiscalYear: new Date().getFullYear(),
      notes: 'Comunidad principal de demostración.',
    },
  })

  // ── Bloque y unidades ─────────────────────────────────────────────
  const building = await prisma.building.create({
    data: { communityId: community.id, name: 'Bloque A', code: 'A' },
  })

  const [unit1A, unit1B, unit2A] = await Promise.all([
    prisma.unit.create({
      data: {
        communityId: community.id,
        buildingId: building.id,
        reference: '1A',
        type: 'APARTMENT',
        floor: '1',
        door: 'A',
        areaM2: 95,
        coefficient: 0.08,
        quotaPercent: 8,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        buildingId: building.id,
        reference: '1B',
        type: 'APARTMENT',
        floor: '1',
        door: 'B',
        areaM2: 110,
        coefficient: 0.1,
        quotaPercent: 10,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        buildingId: building.id,
        reference: '2A',
        type: 'APARTMENT',
        floor: '2',
        door: 'A',
        areaM2: 88,
        coefficient: 0.07,
        quotaPercent: 7,
      },
    }),
  ])

  // ── Propietarios (registros, no usuarios de login) ─────────────────
  // La propietaria = usuario "propietario@comunet.test"
  const ownerLaura = await prisma.owner.create({
    data: {
      officeId: office.id,
      fullName: 'Laura Gómez Prieto',
      dni: '11111111A',
      email: 'propietario@comunet.test',
      phone: '600111001',
    },
  })

  // La presidenta = usuario "presidenta@comunet.test"
  const ownerMaria = await prisma.owner.create({
    data: {
      officeId: office.id,
      fullName: 'María Pérez Torres',
      dni: '22222222B',
      email: 'presidenta@comunet.test',
      phone: '600111002',
    },
  })

  // Propietario extra (sin cuenta de acceso) para tener datos en la lista
  const ownerCarlos = await prisma.owner.create({
    data: {
      officeId: office.id,
      fullName: 'Carlos Ruiz Serrano',
      dni: '33333333C',
      email: 'carlos@example.com',
      phone: '600111003',
    },
  })

  // ── Arrendatario de ejemplo ────────────────────────────────────────
  await prisma.tenant.create({
    data: {
      officeId: office.id,
      fullName: 'Inés Sánchez Martín',
      dni: '44444444D',
      email: 'ines@example.com',
      phone: '611222333',
      address: 'Calle de los Pinos 45, 2A',
    },
  })

  // ── Propiedades ────────────────────────────────────────────────────
  await prisma.ownership.createMany({
    data: [
      { unitId: unit1A.id, ownerId: ownerLaura.id, ownershipPercent: 100, isPrimaryBillingContact: true },
      { unitId: unit1B.id, ownerId: ownerMaria.id, ownershipPercent: 100, isPrimaryBillingContact: true },
      { unitId: unit2A.id, ownerId: ownerCarlos.id, ownershipPercent: 100, isPrimaryBillingContact: true },
    ],
  })

  // ── Junta directiva ────────────────────────────────────────────────
  await prisma.boardPosition.create({
    data: { communityId: community.id, ownerId: ownerMaria.id, role: 'PRESIDENT' },
  })

  // ── Proveedor ──────────────────────────────────────────────────────
  const provider = await prisma.provider.create({
    data: {
      officeId: office.id,
      name: 'Fontanería Rápida 24h',
      cif: 'B99887766',
      email: 'proveedor@comunet.test',
      phone: '915001122',
      category: 'Fontanería',
      address: 'Calle Galileo 14, Madrid',
      notes: 'Proveedor principal para urgencias de fontanería.',
    },
  })

  // ── 4 USUARIOS DE ACCESO ───────────────────────────────────────────
  const [adminUser, ownerUser, presidentUser, providerUser] = await Promise.all([
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Administrador',
        email: 'admin@comunet.test',
        passwordHash,
        role: 'OFFICE_ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Laura Gómez (Propietaria)',
        email: 'propietario@comunet.test',
        passwordHash,
        role: 'OWNER',
        linkedOwnerId: ownerLaura.id,
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'María Pérez (Presidenta)',
        email: 'presidenta@comunet.test',
        passwordHash,
        role: 'PRESIDENT',
        linkedOwnerId: ownerMaria.id,
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Fontanería Rápida (Proveedor)',
        email: 'proveedor@comunet.test',
        passwordHash,
        role: 'PROVIDER',
        linkedProviderId: provider.id,
      },
    }),
  ])

  console.log('✅ Users, community and actors created')

  // ── Presupuesto ────────────────────────────────────────────────────
  await prisma.budget.create({
    data: {
      communityId: community.id,
      year: new Date().getFullYear(),
      totalAmount: 15000,
      status: 'APPROVED',
      lines: {
        create: [
          { concept: 'Limpieza portal y zonas comunes', amount: 4800, category: 'Mantenimiento' },
          { concept: 'Mantenimiento ascensor', amount: 3600, category: 'Mantenimiento' },
          { concept: 'Seguro del edificio', amount: 1800, category: 'Administración' },
          { concept: 'Honorarios administración', amount: 2400, category: 'Administración' },
          { concept: 'Fondo de reserva', amount: 2400, category: 'Reserva' },
        ],
      },
    },
  })

  // ── Regla de cuota ─────────────────────────────────────────────────
  await prisma.feeRule.create({
    data: {
      communityId: community.id,
      name: 'Cuota mensual ordinaria',
      frequency: 'MONTHLY',
      startDate: new Date(`${new Date().getFullYear()}-01-01T00:00:00Z`),
      calculationBase: 'COEFFICIENT',
      fixedAmount: 15000,
      active: true,
    },
  })

  // ── Recibos ────────────────────────────────────────────────────────
  const receiptPaid = await prisma.receipt.create({
    data: {
      communityId: community.id,
      unitId: unit1A.id,
      ownerId: ownerLaura.id,
      periodStart: new Date('2026-01-01T00:00:00Z'),
      periodEnd: new Date('2026-01-31T23:59:59Z'),
      issueDate: new Date('2025-12-28T09:00:00Z'),
      dueDate: new Date('2026-01-10T23:59:59Z'),
      amount: 120,
      paidAmount: 120,
      status: 'PAID',
      reference: 'REC-2026-000001',
    },
  })

  const receiptOverdue = await prisma.receipt.create({
    data: {
      communityId: community.id,
      unitId: unit2A.id,
      ownerId: ownerCarlos.id,
      periodStart: new Date('2026-02-01T00:00:00Z'),
      periodEnd: new Date('2026-02-28T23:59:59Z'),
      issueDate: new Date('2026-01-26T09:00:00Z'),
      dueDate: new Date('2026-02-10T23:59:59Z'),
      amount: 105,
      paidAmount: 0,
      status: 'OVERDUE',
      reference: 'REC-2026-000002',
    },
  })

  const receiptIssued = await prisma.receipt.create({
    data: {
      communityId: community.id,
      unitId: unit1B.id,
      ownerId: ownerMaria.id,
      periodStart: new Date('2026-03-01T00:00:00Z'),
      periodEnd: new Date('2026-03-31T23:59:59Z'),
      issueDate: new Date('2026-02-25T09:00:00Z'),
      dueDate: new Date('2026-03-10T23:59:59Z'),
      amount: 150,
      paidAmount: 0,
      status: 'ISSUED',
      reference: 'REC-2026-000003',
    },
  })

  // ── Pago ───────────────────────────────────────────────────────────
  await prisma.payment.create({
    data: {
      receiptId: receiptPaid.id,
      amount: 120,
      paymentDate: new Date('2026-01-08T10:00:00Z'),
      method: 'BANK_TRANSFER',
      reference: 'TRF-2026-0001',
    },
  })

  // ── Deuda ──────────────────────────────────────────────────────────
  await prisma.debt.create({
    data: {
      communityId: community.id,
      unitId: unit2A.id,
      ownerId: ownerCarlos.id,
      receiptId: receiptOverdue.id,
      principal: 105,
      surcharge: 0,
      status: 'PENDING',
    },
  })

  console.log('✅ Finance data created')

  // ── Incidencia ─────────────────────────────────────────────────────
  const incident = await prisma.incident.create({
    data: {
      communityId: community.id,
      unitId: unit1A.id,
      createdByUserId: ownerUser.id,
      assignedProviderId: provider.id,
      title: 'Fuga de agua en bajante del portal',
      description: 'Se detecta humedad constante en el cuarto de contadores del portal.',
      priority: 'URGENT',
      status: 'ASSIGNED',
      reportedAt: new Date('2026-03-20T09:00:00Z'),
      dueAt: new Date('2026-03-22T18:00:00Z'),
    },
  })

  await prisma.incidentComment.create({
    data: {
      incidentId: incident.id,
      authorUserId: adminUser.id,
      body: 'Proveedor contactado. Tiene visita programada para mañana a las 10h.',
      visibility: 'SHARED',
      createdAt: new Date('2026-03-20T09:30:00Z'),
    },
  })

  await prisma.incidentComment.create({
    data: {
      incidentId: incident.id,
      authorUserId: providerUser.id,
      body: 'Confirmamos visita. Llevaremos material de sellado y cámara de inspección.',
      visibility: 'SHARED',
      createdAt: new Date('2026-03-20T11:00:00Z'),
    },
  })

  console.log('✅ Incidents created')

  // ── Reunión ────────────────────────────────────────────────────────
  const meeting = await prisma.meeting.create({
    data: {
      communityId: community.id,
      title: 'Junta General Ordinaria 2026',
      meetingType: 'ORDINARY',
      scheduledAt: new Date('2026-04-15T18:00:00Z'),
      location: 'Sala de reuniones, planta baja',
      status: 'SCHEDULED',
    },
  })

  await prisma.agendaItem.createMany({
    data: [
      {
        meetingId: meeting.id,
        sortOrder: 1,
        title: 'Lectura y aprobación del acta anterior',
        description: 'Revisión del acta de la junta del año pasado.',
      },
      {
        meetingId: meeting.id,
        sortOrder: 2,
        title: 'Aprobación del presupuesto 2026',
        description: `Presentación y votación del presupuesto ordinario por importe de 15.000 €.`,
      },
      {
        meetingId: meeting.id,
        sortOrder: 3,
        title: 'Ruegos y preguntas',
        description: null,
      },
    ],
  })

  // Asistencia de la presidenta
  await prisma.attendance.create({
    data: {
      meetingId: meeting.id,
      ownerId: ownerMaria.id,
      unitId: unit1B.id,
      attendeeName: 'María Pérez Torres',
      coefficientPresent: 0.1,
      attendanceType: 'IN_PERSON',
    },
  })

  console.log('✅ Meeting created')

  // ── Audit log de ejemplo ───────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      officeId: office.id,
      userId: adminUser.id,
      entityType: 'INCIDENT',
      entityId: incident.id,
      action: 'CREATE',
      metaJson: JSON.stringify({ title: incident.title, priority: 'URGENT', status: 'ASSIGNED' }),
      createdAt: new Date('2026-03-20T09:00:00Z'),
    },
  })

  // ── Notificación de ejemplo ────────────────────────────────────────
  await prisma.notification.create({
    data: {
      officeId: office.id,
      recipientUserId: ownerUser.id,
      title: 'Nueva respuesta en tu incidencia',
      body: 'El administrador ha añadido información sobre la fuga de agua.',
    },
  })

  void receiptIssued

  console.log('\n✅ Seed completed!\n')
  console.log('🔐 Password for all accounts: Demo1234!\n')
  console.log('   👤 admin@comunet.test         → Administrador (backoffice completo)')
  console.log('   🏠 propietario@comunet.test   → Propietario/a Laura (portal)')
  console.log('   👑 presidenta@comunet.test    → Presidenta María (portal + junta)')
  console.log('   🔧 proveedor@comunet.test     → Proveedor Fontanería (portal incidencias)\n')
}

main()
  .catch((error) => {
    console.error('❌ Error in seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
