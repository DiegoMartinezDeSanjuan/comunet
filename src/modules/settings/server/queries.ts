import 'server-only'

import { requireAuth } from '@/lib/auth'
import { canReadSettings, canManageOfficeSettings } from '@/lib/permissions'
import { getOfficeProfile } from './repository'

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

