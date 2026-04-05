import 'server-only'

import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// -- Dashboard Queries --
export async function getDashboardOwnerDebts(ownerId: string, communityIds: string[]) {
  if (communityIds.length === 0) return []
  return prisma.debt.findMany({
    where: {
      ownerId,
      communityId: { in: communityIds },
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
    },
    select: {
      communityId: true,
      principal: true,
      surcharge: true,
    },
  })
}

export async function getDashboardLatestReceipts(ownerId: string, communityIds: string[]) {
  if (communityIds.length === 0) return []
  return prisma.receipt.findMany({
    where: {
      ownerId,
      communityId: { in: communityIds },
    },
    include: {
      community: { select: { id: true, name: true } },
      unit: { select: { id: true, reference: true } },
    },
    orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    take: 6,
  })
}

export async function getDashboardOwnedIncidents(officeId: string, unitIds: string[]) {
  if (unitIds.length === 0) return []
  return prisma.incident.findMany({
    where: {
      unitId: { in: unitIds },
      status: { notIn: ['RESOLVED', 'CLOSED'] },
      community: { officeId },
    },
    include: {
      community: { select: { id: true, name: true } },
      unit: { select: { id: true, reference: true } },
      assignedProvider: { select: { id: true, name: true } },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 8,
  })
}

export async function getDashboardPresidentIncidents(communityIds: string[]) {
  if (communityIds.length === 0) return []
  return prisma.incident.findMany({
    where: {
      communityId: { in: communityIds },
      status: { notIn: ['RESOLVED', 'CLOSED'] },
    },
    select: {
      communityId: true,
      priority: true,
    },
  })
}

export async function getDashboardPresidentDebts(communityIds: string[]) {
  if (communityIds.length === 0) return []
  return prisma.debt.findMany({
    where: {
      communityId: { in: communityIds },
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
    },
    select: {
      communityId: true,
      principal: true,
      surcharge: true,
    },
  })
}
export async function getIncidentsData(andConditions: Prisma.IncidentWhereInput[]) {
  return prisma.incident.findMany({
    where: { AND: andConditions },
    include: {
      community: { select: { id: true, name: true } },
      unit: { select: { id: true, reference: true } },
      createdBy: { select: { id: true, name: true } },
      assignedProvider: { select: { id: true, name: true } },
      comments: { select: { id: true, visibility: true } },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })
}
export async function getIncidentDetailData(incidentId: string) {
  return prisma.incident.findFirst({
    where: { id: incidentId },
    include: {
      community: { select: { id: true, name: true, officeId: true } },
      unit: { select: { id: true, reference: true, floor: true, door: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedProvider: { select: { id: true, name: true, category: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })
}
// -- Provider Queries --
export async function getProviderDashboardDb(where: Prisma.IncidentWhereInput) {
  return Promise.all([
    prisma.incident.count({ where: { ...where, status: { notIn: ['CLOSED'] } } }),
    prisma.incident.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.incident.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.incident.findMany({
      where,
      include: {
        community: { select: { id: true, name: true } },
        unit: { select: { id: true, reference: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 8,
    }),
  ])
}

export async function getProviderIncidentsListDb(andConditions: Prisma.IncidentWhereInput[]) {
  const items = await prisma.incident.findMany({
    where: { AND: andConditions },
    include: {
      community: { select: { id: true, name: true } },
      unit: { select: { id: true, reference: true } },
      comments: { select: { id: true, visibility: true } },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  const communityIds = [...new Set(items.map((i) => i.communityId))]
  const communities = await prisma.community.findMany({
    where: { id: { in: communityIds } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return { items, communities }
}

export async function getProviderIncidentDetailDb(incidentId: string, linkedProviderId: string, officeId: string) {
  return prisma.incident.findFirst({
    where: {
      id: incidentId,
      assignedProviderId: linkedProviderId,
      community: { officeId },
    },
    include: {
      community: { select: { id: true, name: true, address: true } },
      unit: { select: { id: true, reference: true, floor: true, door: true } },
      assignedProvider: { select: { id: true, name: true, category: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export async function getProviderIncidentAuthDb(incidentId: string, linkedProviderId: string, officeId: string) {
  return prisma.incident.findFirst({
    where: {
      id: incidentId,
      assignedProviderId: linkedProviderId,
      community: { officeId },
    },
  })
}

export async function updateProviderIncidentStatusDb(incidentId: string, newStatus: string, resolvedAt: Date | null) {
  return prisma.incident.update({
    where: { id: incidentId },
    data: { status: newStatus as any, resolvedAt },
  })
}

// -- Receipt Queries --
export async function getPortalReceiptsDb(where: Prisma.ReceiptWhereInput) {
  return prisma.receipt.findMany({
    where,
    include: {
      community: { select: { id: true, name: true } },
      unit: { select: { id: true, reference: true } },
      payments: { select: { id: true, amount: true, paymentDate: true } },
      debts: { select: { id: true, principal: true, surcharge: true, status: true } },
    },
    orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })
}

export async function getPortalReceiptDetailDb(receiptId: string) {
  return prisma.receipt.findFirst({
    where: { id: receiptId },
    include: {
      community: { select: { id: true, name: true, officeId: true } },
      unit: {
        select: {
          id: true,
          reference: true,
          floor: true,
          door: true,
          building: { select: { id: true, name: true } },
        },
      },
      owner: { select: { id: true, fullName: true, email: true } },
      payments: {
        orderBy: { paymentDate: 'desc' },
        select: { id: true, amount: true, paymentDate: true, method: true, reference: true, notes: true },
      },
      debts: {
        select: { id: true, principal: true, surcharge: true, status: true, createdAt: true },
      },
    },
  })
}

// -- Policy Queries --
export async function getPortalOwnershipsDb(ownerId: string, activeDateFilter: any, officeId: string) {
  return prisma.ownership.findMany({
    where: {
      ownerId,
      ...activeDateFilter,
      unit: { active: true, community: { officeId, archivedAt: null } },
    },
    select: {
      unitId: true,
      unit: { select: { id: true, reference: true, communityId: true, community: { select: { id: true, name: true } } } },
    },
  })
}

export async function getPortalPresidentPositionsDb(ownerId: string, activeDateFilter: any, officeId: string) {
  return prisma.boardPosition.findMany({
    where: {
      ownerId, role: 'PRESIDENT', ...activeDateFilter,
      community: { officeId, archivedAt: null },
    },
    select: { communityId: true, community: { select: { id: true, name: true } } },
  })
}

export async function getActiveOwnershipForUnitDb(ownerId: string, unitId: string, activeDateFilter: any, officeId: string) {
  return prisma.ownership.findFirst({
    where: { ownerId, unitId, ...activeDateFilter, unit: { active: true, community: { officeId, archivedAt: null } } },
    select: { id: true },
  })
}

export async function getActiveOwnershipForCommunityDb(ownerId: string, communityId: string, activeDateFilter: any, officeId: string) {
  return prisma.ownership.findFirst({
    where: { ownerId, ...activeDateFilter, unit: { communityId, active: true, community: { officeId, archivedAt: null } } },
    select: { id: true },
  })
}

export async function getActivePresidentPositionDb(communityId: string, ownerId: string, activeDateFilter: any, officeId: string) {
  return prisma.boardPosition.findFirst({
    where: { communityId, ownerId, role: 'PRESIDENT', ...activeDateFilter, community: { officeId, archivedAt: null } },
    select: { id: true },
  })
}

export async function getReceiptAccessInfoDb(receiptId: string) {
  return prisma.receipt.findFirst({
    where: { id: receiptId },
    select: { ownerId: true, community: { select: { officeId: true } } },
  })
}

export async function getIncidentAccessInfoDb(incidentId: string) {
  return prisma.incident.findFirst({
    where: { id: incidentId },
    select: { communityId: true, unitId: true, community: { select: { officeId: true } } },
  })
}
