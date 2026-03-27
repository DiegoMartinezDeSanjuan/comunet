'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canManageOfficeSettings } from '@/lib/permissions'
import { logAudit } from '@/modules/audit/server/services'

const updateOfficeSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  nif: z.string().min(5, 'El NIF es requerido'),
  email: z.string().email('Email no válido'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export async function updateOfficeProfileAction(data: z.infer<typeof updateOfficeSchema>) {
  const session = await requireAuth()

  if (!canManageOfficeSettings(session)) {
    throw new Error('No tienes permisos para modificar la configuración del despacho')
  }

  const parsed = updateOfficeSchema.parse(data)

  const updated = await prisma.office.update({
    where: { id: session.officeId },
    data: parsed,
  })

  await logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'OFFICE',
    entityId: session.officeId,
    action: 'UPDATE',
    meta: {
      diff: parsed, // we could compute a real diff, but sending new state is sufficient for this scope
    },
  })

  revalidatePath('/settings')
  return updated
}
