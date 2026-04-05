import 'server-only'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { canReadSettings, canManageOfficeSettings } from '@/lib/permissions'

/**
 * Settings layout auth — resolves auth + canReadSettings.
 */
export async function requireSettingsAccessQuery() {
  const session = await requireAuth()
  if (!canReadSettings(session)) {
    throw new Error('FORBIDDEN')
  }
  return { session }
}

/**
 * Settings page — resolves auth + settings read + office profile.
 */
export async function getSettingsPageQuery() {
  const session = await requireAuth()
  if (!canReadSettings(session)) {
    throw new Error('FORBIDDEN')
  }
  const office = await getOfficeProfile(session.officeId)
  const canEdit = canManageOfficeSettings(session)
  return { office, canEdit, session }
}

export async function getOfficeProfile(officeId: string) {
  const office = await prisma.office.findUnique({
    where: { id: officeId },
    include: {
      _count: {
        select: {
          communities: { where: { archivedAt: null } },
          users: { where: { archivedAt: null } },
          providers: { where: { archivedAt: null } },
        },
      },
    },
  })

  return office
}
