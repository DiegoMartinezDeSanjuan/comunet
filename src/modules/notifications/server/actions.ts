'use server'

import { revalidatePath } from 'next/cache'

import { isBackofficeRole, requireAuth } from '@/lib/auth'
import { markNotificationReadRecord } from './repository'

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireAuth()

  if (!isBackofficeRole(session.role)) {
    throw new Error('FORBIDDEN')
  }

  await markNotificationReadRecord(
    session.officeId,
    session.userId,
    notificationId,
  )

  revalidatePath('/notifications')

  return { ok: true }
}
