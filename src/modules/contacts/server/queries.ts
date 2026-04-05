import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import * as repo from './contact-repository'

/* ─── Owners ─────────────────────────────────────────── */

export async function listOwnersPageQuery(search?: string) {
    const session = await requireAuth()
    const owners = await repo.findOwnersByOffice(session.officeId, search)
    return { owners, session }
}

export async function getOwnerDetailQuery(id: string) {
    const session = await requireAuth()
    const owner = await repo.findOwnerById(id, session.officeId)
    return { owner, session }
}

export async function getOwnerEditDataQuery(id: string) {
    const session = await requireAuth()
    if (!requirePermission(session, 'owners.manage')) {
        throw new Error('FORBIDDEN')
    }
    const owner = await repo.findOwnerById(id, session.officeId)
    return { owner, session }
}

/**
 * Guard query — resolves auth + permission for create pages.
 */
export async function requireOwnersManageQuery() {
    const session = await requireAuth()
    if (!requirePermission(session, 'owners.manage')) {
        throw new Error('FORBIDDEN')
    }
    return { session }
}

/* ─── Tenants ────────────────────────────────────────── */

export async function listTenantsPageQuery(search?: string) {
    const session = await requireAuth()
    const tenants = await repo.findTenantsByOffice(session.officeId, search)
    return { tenants, session }
}

export async function getTenantDetailQuery(id: string) {
    const session = await requireAuth()
    const tenant = await repo.findTenantById(id, session.officeId)
    return { tenant, session }
}

export async function getTenantEditDataQuery(id: string) {
    const session = await requireAuth()
    if (!requirePermission(session, 'owners.manage')) {
        throw new Error('FORBIDDEN')
    }
    const tenant = await repo.findTenantById(id, session.officeId)
    return { tenant, session }
}
