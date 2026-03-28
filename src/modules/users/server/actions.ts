'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { randomBytes } from 'crypto'

import { requireAuth, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canManageUsers } from '@/lib/permissions'
import { logAudit } from '@/modules/audit/server/services'
import { UserRole, UserStatus } from '@prisma/client'

const userFormSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus).default('ACTIVE'),
  linkedOwnerId: z.string().optional().nullable(),
  linkedProviderId: z.string().optional().nullable(),
})

export async function createUser(data: z.infer<typeof userFormSchema>) {
  const session = await requireAuth()
  if (!canManageUsers(session)) throw new Error('FORBIDDEN')

  const parsed = userFormSchema.parse(data)

  const existing = await prisma.user.findFirst({
    where: { email: parsed.email },
  })

  if (existing) {
    throw new Error('El email ya está en uso en el sistema')
  }

  if (parsed.linkedOwnerId) {
    const owner = await prisma.owner.findFirst({ where: { id: parsed.linkedOwnerId, officeId: session.officeId } })
    if (!owner) throw new Error('El propietario no existe o no pertenece al despacho.')
  }

  if (parsed.linkedProviderId) {
    const provider = await prisma.provider.findFirst({ where: { id: parsed.linkedProviderId, officeId: session.officeId } })
    if (!provider) throw new Error('El proveedor no existe o no pertenece al despacho.')
  }

  const temporaryPassword = randomBytes(4).toString('hex')
  const passwordHash = await hashPassword(temporaryPassword)

  const user = await prisma.user.create({
    data: {
      officeId: session.officeId,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      status: parsed.status,
      linkedOwnerId: parsed.linkedOwnerId || null,
      linkedProviderId: parsed.linkedProviderId || null,
      passwordHash,
    },
  })

  logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'USER',
    entityId: user.id,
    action: 'CREATE',
    meta: { role: user.role },
  })

  revalidatePath('/settings/users')
  return { user, temporaryPassword }
}

export async function updateUser(userId: string, data: z.infer<typeof userFormSchema>) {
  const session = await requireAuth()
  if (!canManageUsers(session)) throw new Error('FORBIDDEN')

  const parsed = userFormSchema.parse(data)

  const user = await prisma.user.findFirst({
    where: { id: userId, officeId: session.officeId },
  })

  if (!user) throw new Error('Usuario no encontrado')

  // Check unique email
  if (user.email !== parsed.email) {
    const existing = await prisma.user.findFirst({
      where: { email: parsed.email },
    })
    if (existing) throw new Error('El email ya está en uso')
  }
  
  // Rule: Do not allow an admin to remove their own admin role if they are the last admin
  if (user.id === session.userId && user.role === 'SUPERADMIN' && parsed.role !== 'SUPERADMIN') {
    const otherAdmins = await prisma.user.count({
      where: { officeId: session.officeId, role: 'SUPERADMIN', status: 'ACTIVE', id: { not: user.id } }
    })
    
    if (otherAdmins === 0) {
      throw new Error('No puedes quitarte el rol SUPERADMIN; eres el único administrador activo.')
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      status: parsed.status,
      linkedOwnerId: parsed.linkedOwnerId || null,
      linkedProviderId: parsed.linkedProviderId || null,
    },
  })

  logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'USER',
    entityId: user.id,
    action: 'UPDATE',
    meta: { diff: parsed },
  })

  revalidatePath('/settings/users')
  return updated
}

export async function archiveUser(userId: string) {
  const session = await requireAuth()
  if (!canManageUsers(session)) throw new Error('FORBIDDEN')

  if (userId === session.userId) {
    throw new Error('No puedes archivar tu propio usuario. Pídeselo a otro administrador.')
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, officeId: session.officeId },
  })

  if (!user) throw new Error('Usuario no encontrado')

  await prisma.user.update({
    where: { id: userId },
    data: { archivedAt: new Date() },
  })

  logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'USER',
    entityId: user.id,
    action: 'ARCHIVE',
  })

  revalidatePath('/settings/users')
}

export async function resetUserPassword(userId: string) {
  const session = await requireAuth()
  if (!canManageUsers(session)) throw new Error('FORBIDDEN')

  const user = await prisma.user.findFirst({
    where: { id: userId, officeId: session.officeId },
  })

  if (!user) throw new Error('Usuario no encontrado')

  const temporaryPassword = randomBytes(4).toString('hex')
  const passwordHash = await hashPassword(temporaryPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'USER',
    entityId: user.id,
    action: 'UPDATE',
    meta: { note: 'Contraseña reseteada manualmente' },
  })

  return { temporaryPassword }
}
