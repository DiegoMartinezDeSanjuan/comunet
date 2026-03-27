import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const passwordHash = await bcrypt.hash('Demo1234!', 12)

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

  console.log('🧹 Previous data removed')

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

  const communityMadrid = await prisma.community.create({
    data: {
      officeId: office.id,
      name: 'Edificio Los Pinos',
      cif: 'H87654321',
      address: 'Calle de los Pinos 45, 28020 Madrid',
      iban: 'ES9121000418401234567890',
      fiscalYear: 2026,
      notes: 'Comunidad residencial principal para demo backoffice.',
    },
  })

  const communityRetiro = await prisma.community.create({
    data: {
      officeId: office.id,
      name: 'Residencial Retiro',
      cif: 'H11223344',
      address: 'Avenida del Retiro 18, 28009 Madrid',
      iban: 'ES7620770024003102575766',
      fiscalYear: 2026,
      notes: 'Segunda comunidad para filtros y paginación.',
    },
  })

  const buildingPinos = await prisma.building.create({
    data: {
      communityId: communityMadrid.id,
      name: 'Bloque A',
      code: 'A',
    },
  })

  const buildingRetiro = await prisma.building.create({
    data: {
      communityId: communityRetiro.id,
      name: 'Bloque Principal',
      code: 'RP',
    },
  })

  const [unit1A, unit1B, unit2A, unitBajo, unit3A] = await Promise.all([
    prisma.unit.create({
      data: {
        communityId: communityMadrid.id,
        buildingId: buildingPinos.id,
        reference: '1A',
        type: 'APARTMENT',
        floor: '1',
        door: 'A',
        areaM2: 95.5,
        coefficient: 0.05,
        quotaPercent: 5.0,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: communityMadrid.id,
        buildingId: buildingPinos.id,
        reference: '1B',
        type: 'APARTMENT',
        floor: '1',
        door: 'B',
        areaM2: 120,
        coefficient: 0.08,
        quotaPercent: 8.0,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: communityRetiro.id,
        buildingId: buildingRetiro.id,
        reference: '2A',
        type: 'APARTMENT',
        floor: '2',
        door: 'A',
        areaM2: 88,
        coefficient: 0.06,
        quotaPercent: 6.0,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: communityRetiro.id,
        buildingId: buildingRetiro.id,
        reference: 'BJ-LOCAL',
        type: 'COMMERCIAL',
        floor: 'BJ',
        door: 'LOCAL',
        areaM2: 150,
        coefficient: 0.09,
        quotaPercent: 9.0,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: communityMadrid.id,
        buildingId: buildingPinos.id,
        reference: '3A',
        type: 'APARTMENT',
        floor: '3',
        door: 'A',
        areaM2: 92,
        coefficient: 0.055,
        quotaPercent: 5.5,
      },
    }),
  ])

  const [ownerCarlos, ownerMaria, ownerLaura, ownerAndres] = await Promise.all([
    prisma.owner.create({
      data: {
        officeId: office.id,
        fullName: 'Carlos García López',
        dni: '12345678A',
        email: 'carlos@example.com',
        phone: '600111222',
      },
    }),
    prisma.owner.create({
      data: {
        officeId: office.id,
        fullName: 'María Martínez Torres',
        dni: '87654321B',
        email: 'presidenta@comunet.test',
        phone: '600333444',
      },
    }),
    prisma.owner.create({
      data: {
        officeId: office.id,
        fullName: 'Laura Gómez Prieto',
        dni: '66554433C',
        email: 'propietario@comunet.test',
        phone: '600555666',
      },
    }),
    prisma.owner.create({
      data: {
        officeId: office.id,
        fullName: 'Andrés Ruiz Serrano',
        dni: '99887766D',
        email: 'andres@example.com',
        phone: '600777888',
      },
    }),
  ])

  await prisma.tenant.create({
    data: {
      officeId: office.id,
      fullName: 'Inés Sánchez Martín',
      dni: '44556677E',
      email: 'ines.inquilina@example.com',
      phone: '611222333',
      address: 'Calle de los Pinos 45, 1A',
    },
  })

  await prisma.ownership.createMany({
    data: [
      {
        unitId: unit1A.id,
        ownerId: ownerCarlos.id,
        ownershipPercent: 100,
        isPrimaryBillingContact: true,
      },
      {
        unitId: unit1B.id,
        ownerId: ownerMaria.id,
        ownershipPercent: 100,
        isPrimaryBillingContact: true,
      },
      {
        unitId: unit2A.id,
        ownerId: ownerLaura.id,
        ownershipPercent: 100,
        isPrimaryBillingContact: true,
      },
      {
        unitId: unitBajo.id,
        ownerId: ownerAndres.id,
        ownershipPercent: 100,
        isPrimaryBillingContact: true,
      },
      {
        unitId: unit3A.id,
        ownerId: ownerLaura.id,
        ownershipPercent: 100,
        isPrimaryBillingContact: true,
      },
    ],
  })

  await prisma.boardPosition.createMany({
    data: [
      {
        communityId: communityMadrid.id,
        ownerId: ownerMaria.id,
        role: 'PRESIDENT',
      },
      {
        communityId: communityRetiro.id,
        ownerId: ownerLaura.id,
        role: 'PRESIDENT',
      },
    ],
  })

  const [providerPlumber, providerElevator, providerElectric, providerPainter] = await Promise.all([
    prisma.provider.create({
      data: {
        officeId: office.id,
        name: 'Fontanería Rápida 24h',
        cif: 'B99887766',
        email: 'contacto@fontaneriarapida.es',
        phone: '915001122',
        category: 'Fontanería',
        address: 'Calle Galileo 14, Madrid',
        notes: 'Proveedor prioritario para fugas y humedades.',
      },
    }),
    prisma.provider.create({
      data: {
        officeId: office.id,
        name: 'Ascensores Hispania',
        cif: 'B44556677',
        email: 'soporte@ascensoreshispania.es',
        phone: '914998877',
        category: 'Ascensores',
        address: 'Paseo Imperial 28, Madrid',
        notes: 'Mantenimiento preventivo y averías.',
      },
    }),
    prisma.provider.create({
      data: {
        officeId: office.id,
        name: 'Electricidad Centro',
        cif: 'B22334455',
        email: 'operaciones@electricidadcentro.es',
        phone: '913334455',
        category: 'Electricidad',
        address: 'Calle Toledo 84, Madrid',
      },
    }),
    prisma.provider.create({
      data: {
        officeId: office.id,
        name: 'Pinturas Manzanares',
        cif: 'B11221122',
        email: 'hola@pinturasmanzanares.es',
        phone: '917776655',
        category: 'Pintura',
        address: 'Calle Embajadores 101, Madrid',
        archivedAt: new Date('2026-01-15T09:00:00Z'),
        notes: 'Archivado por inactividad prolongada.',
      },
    }),
  ])

  void providerPainter

  const [officeAdmin, manager, accountant, viewer, presidentUser, ownerUser, providerPlumberUser, providerElevatorUser] = await Promise.all([
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Admin Fincas',
        email: 'admin@fincasmartinez.es',
        passwordHash,
        role: 'OFFICE_ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Marta Operaciones',
        email: 'manager@fincasmartinez.es',
        passwordHash,
        role: 'MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Luis Contabilidad',
        email: 'accountant@fincasmartinez.es',
        passwordHash,
        role: 'ACCOUNTANT',
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Paula Lectura',
        email: 'viewer@fincasmartinez.es',
        passwordHash,
        role: 'VIEWER',
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'María Martínez (Presidenta)',
        email: 'presidenta@comunet.test',
        passwordHash,
        role: 'PRESIDENT',
        linkedOwnerId: ownerMaria.id,
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
        name: 'Operador Fontanería Rápida',
        email: 'proveedor.fontaneria@comunet.test',
        passwordHash,
        role: 'PROVIDER',
        linkedProviderId: providerPlumber.id,
      },
    }),
    prisma.user.create({
      data: {
        officeId: office.id,
        name: 'Operador Ascensores Hispania',
        email: 'proveedor.ascensores@comunet.test',
        passwordHash,
        role: 'PROVIDER',
        linkedProviderId: providerElevator.id,
      },
    }),
  ])

  console.log('✅ Core office, communities, actors and providers created')

  await prisma.budget.create({
    data: {
      communityId: communityMadrid.id,
      year: 2026,
      totalAmount: 18250,
      status: 'APPROVED',
      lines: {
        create: [
          { concept: 'Limpieza', amount: 5200, category: 'Mantenimiento' },
          { concept: 'Ascensor', amount: 3600, category: 'Mantenimiento' },
          { concept: 'Seguro', amount: 1450, category: 'Administración' },
          { concept: 'Administración', amount: 4200, category: 'Administración' },
          { concept: 'Fondo de reserva', amount: 3800, category: 'Reserva' },
        ],
      },
    },
  })

  await prisma.feeRule.createMany({
    data: [
      {
        communityId: communityMadrid.id,
        name: 'Cuota ordinaria 2026',
        frequency: 'MONTHLY',
        startDate: new Date('2026-01-01T00:00:00Z'),
        calculationBase: 'COEFFICIENT',
        fixedAmount: 18250,
        active: true,
      },
      {
        communityId: communityRetiro.id,
        name: 'Cuota ordinaria Retiro 2026',
        frequency: 'MONTHLY',
        startDate: new Date('2026-01-01T00:00:00Z'),
        calculationBase: 'FIXED',
        fixedAmount: 210,
        active: true,
      },
    ],
  })

  const receiptOverdue = await prisma.receipt.create({
    data: {
      communityId: communityMadrid.id,
      unitId: unit1A.id,
      ownerId: ownerCarlos.id,
      periodStart: new Date('2026-02-01T00:00:00Z'),
      periodEnd: new Date('2026-02-28T23:59:59Z'),
      issueDate: new Date('2026-01-26T09:00:00Z'),
      dueDate: new Date('2026-02-05T23:59:59Z'),
      amount: 100,
      status: 'OVERDUE',
      reference: 'REC-2026-000001',
    },
  })

  const receiptPaid = await prisma.receipt.create({
    data: {
      communityId: communityMadrid.id,
      unitId: unit1B.id,
      ownerId: ownerMaria.id,
      periodStart: new Date('2026-02-01T00:00:00Z'),
      periodEnd: new Date('2026-02-28T23:59:59Z'),
      issueDate: new Date('2026-01-26T09:00:00Z'),
      dueDate: new Date('2026-02-05T23:59:59Z'),
      amount: 160,
      paidAmount: 160,
      status: 'PAID',
      reference: 'REC-2026-000002',
    },
  })

  const receiptPartial = await prisma.receipt.create({
    data: {
      communityId: communityRetiro.id,
      unitId: unit2A.id,
      ownerId: ownerLaura.id,
      periodStart: new Date('2026-02-01T00:00:00Z'),
      periodEnd: new Date('2026-02-28T23:59:59Z'),
      issueDate: new Date('2026-01-26T09:00:00Z'),
      dueDate: new Date('2026-02-10T23:59:59Z'),
      amount: 210,
      paidAmount: 80,
      status: 'PARTIALLY_PAID',
      reference: 'REC-2026-000003',
    },
  })

  const receiptIssuedPortal = await prisma.receipt.create({
    data: {
      communityId: communityMadrid.id,
      unitId: unit3A.id,
      ownerId: ownerLaura.id,
      periodStart: new Date('2026-03-01T00:00:00Z'),
      periodEnd: new Date('2026-03-31T23:59:59Z'),
      issueDate: new Date('2026-03-25T09:00:00Z'),
      dueDate: new Date('2026-04-05T23:59:59Z'),
      amount: 145,
      paidAmount: 0,
      status: 'ISSUED',
      reference: 'REC-2026-000004',
    },
  })

  await prisma.payment.createMany({
    data: [
      {
        receiptId: receiptPaid.id,
        amount: 160,
        paymentDate: new Date('2026-02-04T11:00:00Z'),
        method: 'BANK_TRANSFER',
        reference: 'TRF-DEMO-991',
      },
      {
        receiptId: receiptPartial.id,
        amount: 80,
        paymentDate: new Date('2026-02-07T16:30:00Z'),
        method: 'DIRECT_DEBIT',
        reference: 'DD-DEMO-2026-80',
      },
    ],
  })

  await prisma.debt.createMany({
    data: [
      {
        communityId: communityMadrid.id,
        unitId: unit1A.id,
        ownerId: ownerCarlos.id,
        receiptId: receiptOverdue.id,
        principal: 100,
        status: 'PENDING',
      },
      {
        communityId: communityRetiro.id,
        unitId: unit2A.id,
        ownerId: ownerLaura.id,
        receiptId: receiptPartial.id,
        principal: 210,
        surcharge: 0,
        status: 'PARTIALLY_PAID',
      },
      {
        communityId: communityMadrid.id,
        unitId: unit3A.id,
        ownerId: ownerLaura.id,
        receiptId: receiptIssuedPortal.id,
        principal: 145,
        surcharge: 0,
        status: 'PENDING',
      },
    ],
  })

  console.log('✅ Finance demo data created')

  const incidentOpen = await prisma.incident.create({
    data: {
      communityId: communityMadrid.id,
      unitId: unit1A.id,
      createdByUserId: officeAdmin.id,
      title: 'Fuga en bajante del portal A',
      description: 'Se detecta humedad constante en el cuarto de contadores.',
      priority: 'URGENT',
      status: 'OPEN',
      reportedAt: new Date('2026-03-18T08:30:00Z'),
      dueAt: new Date('2026-03-19T18:00:00Z'),
    },
  })

  const incidentAssigned = await prisma.incident.create({
    data: {
      communityId: communityMadrid.id,
      unitId: unit1B.id,
      createdByUserId: manager.id,
      assignedProviderId: providerPlumber.id,
      title: 'Humedad en garaje plaza 14',
      description: 'Filtración visible en el falso techo del garaje.',
      priority: 'HIGH',
      status: 'ASSIGNED',
      reportedAt: new Date('2026-03-20T09:00:00Z'),
      dueAt: new Date('2026-03-24T17:00:00Z'),
    },
  })

  const incidentInProgress = await prisma.incident.create({
    data: {
      communityId: communityRetiro.id,
      createdByUserId: presidentUser.id,
      assignedProviderId: providerElectric.id,
      title: 'Luminaria fundida en portal principal',
      description: 'No funciona la iluminación de acceso desde la calle.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      reportedAt: new Date('2026-03-17T18:10:00Z'),
      dueAt: new Date('2026-03-27T14:00:00Z'),
    },
  })

  const incidentResolved = await prisma.incident.create({
    data: {
      communityId: communityRetiro.id,
      unitId: unit2A.id,
      createdByUserId: ownerUser.id,
      assignedProviderId: providerElevator.id,
      title: 'Avería puntual en ascensor',
      description: 'El ascensor se queda bloqueado entre plantas.',
      priority: 'HIGH',
      status: 'RESOLVED',
      reportedAt: new Date('2026-03-10T07:45:00Z'),
      dueAt: new Date('2026-03-11T18:00:00Z'),
      resolvedAt: new Date('2026-03-12T13:30:00Z'),
    },
  })

  const incidentOwnerPortal = await prisma.incident.create({
    data: {
      communityId: communityMadrid.id,
      unitId: unit3A.id,
      createdByUserId: ownerUser.id,
      title: 'Puerta del trastero no cierra',
      description: 'La puerta metálica del trastero de la planta 3 no ajusta bien y queda abierta.',
      priority: 'MEDIUM',
      status: 'OPEN',
      reportedAt: new Date('2026-03-22T19:10:00Z'),
      dueAt: new Date('2026-03-29T14:00:00Z'),
    },
  })

  const incidentClosed = await prisma.incident.create({
    data: {
      communityId: communityMadrid.id,
      createdByUserId: officeAdmin.id,
      assignedProviderId: providerElevator.id,
      title: 'Revisión anual de ascensor cerrada',
      description: 'Cierre administrativo de la intervención anual.',
      priority: 'LOW',
      status: 'CLOSED',
      reportedAt: new Date('2026-02-15T10:00:00Z'),
      dueAt: new Date('2026-02-20T18:00:00Z'),
      resolvedAt: new Date('2026-02-18T09:30:00Z'),
    },
  })

  const [commentAssignedInternal, commentAssignedShared, commentResolvedShared, commentOwnerInternal, commentOwnerShared] = await Promise.all([
    prisma.incidentComment.create({
      data: {
        incidentId: incidentAssigned.id,
        authorUserId: officeAdmin.id,
        body: 'Proveedor avisado. Pendiente de visita mañana a primera hora.',
        visibility: 'INTERNAL',
        createdAt: new Date('2026-03-20T09:15:00Z'),
      },
    }),
    prisma.incidentComment.create({
      data: {
        incidentId: incidentAssigned.id,
        authorUserId: manager.id,
        body: 'Se comparte seguimiento con proveedor y presidencia.',
        visibility: 'SHARED',
        createdAt: new Date('2026-03-20T10:00:00Z'),
      },
    }),
    prisma.incidentComment.create({
      data: {
        incidentId: incidentResolved.id,
        authorUserId: providerElevatorUser.id,
        body: 'La maniobra se ha reajustado y el equipo vuelve a operar con normalidad.',
        visibility: 'SHARED',
        createdAt: new Date('2026-03-12T12:50:00Z'),
      },
    }),
    prisma.incidentComment.create({
      data: {
        incidentId: incidentOwnerPortal.id,
        authorUserId: officeAdmin.id,
        body: 'Se revisará cobertura de seguro antes de solicitar presupuesto.',
        visibility: 'INTERNAL',
        createdAt: new Date('2026-03-23T09:00:00Z'),
      },
    }),
    prisma.incidentComment.create({
      data: {
        incidentId: incidentOwnerPortal.id,
        authorUserId: manager.id,
        body: 'Hemos registrado la incidencia y estamos coordinando una visita de revisión.',
        visibility: 'SHARED',
        createdAt: new Date('2026-03-23T10:15:00Z'),
      },
    }),
  ])

  await prisma.auditLog.createMany({
    data: [
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentOpen.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          title: incidentOpen.title,
          priority: incidentOpen.priority,
          status: incidentOpen.status,
          assignedProviderId: incidentOpen.assignedProviderId,
        }),
        createdAt: new Date('2026-03-18T08:30:00Z'),
      },
      {
        officeId: office.id,
        userId: manager.id,
        entityType: 'INCIDENT',
        entityId: incidentAssigned.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          title: incidentAssigned.title,
          priority: incidentAssigned.priority,
          status: 'OPEN',
          assignedProviderId: null,
        }),
        createdAt: new Date('2026-03-20T09:00:00Z'),
      },
      {
        officeId: office.id,
        userId: manager.id,
        entityType: 'INCIDENT',
        entityId: incidentAssigned.id,
        action: 'UPDATE',
        metaJson: JSON.stringify({
          type: 'PROVIDER_ASSIGNMENT',
          previousProviderId: null,
          nextProviderId: providerPlumber.id,
          previousStatus: 'OPEN',
          nextStatus: 'ASSIGNED',
        }),
        createdAt: new Date('2026-03-20T09:02:00Z'),
      },
      {
        officeId: office.id,
        userId: manager.id,
        entityType: 'INCIDENT',
        entityId: incidentAssigned.id,
        action: 'STATUS_CHANGE',
        metaJson: JSON.stringify({
          previousStatus: 'OPEN',
          nextStatus: 'ASSIGNED',
        }),
        createdAt: new Date('2026-03-20T09:02:00Z'),
      },
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentInProgress.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          title: incidentInProgress.title,
          priority: incidentInProgress.priority,
          status: 'OPEN',
          assignedProviderId: null,
        }),
        createdAt: new Date('2026-03-17T18:10:00Z'),
      },
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentInProgress.id,
        action: 'UPDATE',
        metaJson: JSON.stringify({
          type: 'PROVIDER_ASSIGNMENT',
          previousProviderId: null,
          nextProviderId: providerElectric.id,
          previousStatus: 'OPEN',
          nextStatus: 'ASSIGNED',
        }),
        createdAt: new Date('2026-03-17T18:30:00Z'),
      },
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentInProgress.id,
        action: 'STATUS_CHANGE',
        metaJson: JSON.stringify({
          previousStatus: 'ASSIGNED',
          nextStatus: 'IN_PROGRESS',
        }),
        createdAt: new Date('2026-03-18T09:00:00Z'),
      },
      {
        officeId: office.id,
        userId: viewer.id,
        entityType: 'INCIDENT',
        entityId: incidentResolved.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          title: incidentResolved.title,
          priority: incidentResolved.priority,
          status: 'OPEN',
          assignedProviderId: null,
        }),
        createdAt: new Date('2026-03-10T07:45:00Z'),
      },
      {
        officeId: office.id,
        userId: viewer.id,
        entityType: 'INCIDENT',
        entityId: incidentResolved.id,
        action: 'UPDATE',
        metaJson: JSON.stringify({
          type: 'PROVIDER_ASSIGNMENT',
          previousProviderId: null,
          nextProviderId: providerElevator.id,
          previousStatus: 'OPEN',
          nextStatus: 'ASSIGNED',
        }),
        createdAt: new Date('2026-03-10T08:10:00Z'),
      },
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentResolved.id,
        action: 'STATUS_CHANGE',
        metaJson: JSON.stringify({
          previousStatus: 'ASSIGNED',
          nextStatus: 'RESOLVED',
          previousResolvedAt: null,
          nextResolvedAt: '2026-03-12T13:30:00.000Z',
        }),
        createdAt: new Date('2026-03-12T13:30:00Z'),
      },
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentClosed.id,
        action: 'STATUS_CHANGE',
        metaJson: JSON.stringify({
          previousStatus: 'RESOLVED',
          nextStatus: 'CLOSED',
          previousResolvedAt: '2026-02-18T09:30:00.000Z',
          nextResolvedAt: '2026-02-18T09:30:00.000Z',
        }),
        createdAt: new Date('2026-02-19T08:00:00Z'),
      },
      {
        officeId: office.id,
        userId: ownerUser.id,
        entityType: 'INCIDENT',
        entityId: incidentOwnerPortal.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          title: incidentOwnerPortal.title,
          priority: incidentOwnerPortal.priority,
          status: incidentOwnerPortal.status,
          assignedProviderId: null,
        }),
        createdAt: new Date('2026-03-22T19:10:00Z'),
      },
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentAssigned.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          type: 'INCIDENT_COMMENT',
          commentId: commentAssignedInternal.id,
          visibility: 'INTERNAL',
        }),
        createdAt: new Date('2026-03-20T09:15:00Z'),
      },
      {
        officeId: office.id,
        userId: manager.id,
        entityType: 'INCIDENT',
        entityId: incidentAssigned.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          type: 'INCIDENT_COMMENT',
          commentId: commentAssignedShared.id,
          visibility: 'SHARED',
        }),
        createdAt: new Date('2026-03-20T10:00:00Z'),
      },
      {
        officeId: office.id,
        userId: providerElevatorUser.id,
        entityType: 'INCIDENT',
        entityId: incidentResolved.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          type: 'INCIDENT_COMMENT',
          commentId: commentResolvedShared.id,
          visibility: 'SHARED',
        }),
        createdAt: new Date('2026-03-12T12:50:00Z'),
      },
      {
        officeId: office.id,
        userId: officeAdmin.id,
        entityType: 'INCIDENT',
        entityId: incidentOwnerPortal.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          type: 'INCIDENT_COMMENT',
          commentId: commentOwnerInternal.id,
          visibility: 'INTERNAL',
        }),
        createdAt: new Date('2026-03-23T09:00:00Z'),
      },
      {
        officeId: office.id,
        userId: manager.id,
        entityType: 'INCIDENT',
        entityId: incidentOwnerPortal.id,
        action: 'CREATE',
        metaJson: JSON.stringify({
          type: 'INCIDENT_COMMENT',
          commentId: commentOwnerShared.id,
          visibility: 'SHARED',
        }),
        createdAt: new Date('2026-03-23T10:15:00Z'),
      },
    ],
  })

  console.log('✅ Incident timeline data created')

  await prisma.notification.createMany({
    data: [
      {
        officeId: office.id,
        communityId: communityMadrid.id,
        recipientUserId: manager.id,
        channel: 'IN_APP',
        title: 'Nueva incidencia creada',
        body: `Incidencia ${incidentOpen.title} (${incidentOpen.id}) creada en backoffice.`,
        status: 'SENT',
        createdAt: new Date('2026-03-18T08:31:00Z'),
        sentAt: new Date('2026-03-18T08:31:00Z'),
      },
      {
        officeId: office.id,
        communityId: communityMadrid.id,
        recipientUserId: accountant.id,
        channel: 'IN_APP',
        title: 'Incidencia asignada',
        body: `La incidencia ${incidentAssigned.title} ha sido asignada a ${providerPlumber.name}.`,
        status: 'SENT',
        createdAt: new Date('2026-03-20T09:03:00Z'),
        sentAt: new Date('2026-03-20T09:03:00Z'),
      },
      {
        officeId: office.id,
        communityId: communityMadrid.id,
        recipientUserId: providerPlumberUser.id,
        channel: 'IN_APP',
        title: 'Nuevo comentario compartido',
        body: `La incidencia ${incidentAssigned.title} tiene un comentario compartido nuevo.`,
        status: 'PENDING',
        createdAt: new Date('2026-03-20T10:01:00Z'),
      },
      {
        officeId: office.id,
        communityId: communityRetiro.id,
        recipientUserId: viewer.id,
        channel: 'IN_APP',
        title: 'Incidencia resuelta',
        body: `La incidencia ${incidentResolved.title} ha sido marcada como resuelta.`,
        status: 'READ',
        createdAt: new Date('2026-03-12T13:31:00Z'),
        sentAt: new Date('2026-03-12T14:00:00Z'),
      },
    ],
  })

  await prisma.meeting.create({
    data: {
      communityId: communityMadrid.id,
      title: 'Junta Ordinaria 2026',
      scheduledAt: new Date('2026-04-15T18:00:00Z'),
      status: 'SCHEDULED',
      location: 'Portal del edificio',
      agendaItems: {
        create: [
          { title: 'Lectura acta anterior', sortOrder: 1 },
          { title: 'Incidencias abiertas y proveedores', sortOrder: 2 },
          { title: 'Aprobación cuentas Q1', sortOrder: 3 },
          { title: 'Ruegos y preguntas', sortOrder: 4 },
        ],
      },
    },
  })

  console.log('✅ Notifications and meetings seeded')
  console.log('👤 Demo backoffice users:')
  console.log('   - admin@fincasmartinez.es')
  console.log('   - manager@fincasmartinez.es')
  console.log('   - accountant@fincasmartinez.es')
  console.log('   - viewer@fincasmartinez.es')
  console.log('👤 Demo portal users:')
  console.log('   - presidenta@comunet.test')
  console.log('   - propietario@comunet.test')
  console.log('   - proveedor.fontaneria@comunet.test')
  console.log('   - proveedor.ascensores@comunet.test')
  console.log('🔐 Password for all users: Demo1234!')
  console.log('✅ Seed completed successfully!')
}

main()
  .catch((error) => {
    console.error('❌ Error in seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
