'use server'

import { destroySession, requireAuth } from '@/lib/auth'
import { logAudit } from '@/modules/audit/server/services'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const session = await requireAuth()
  
  await logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'User',
    entityId: session.userId,
    action: 'LOGOUT',
  })

  await destroySession()
  redirect('/login')
}
