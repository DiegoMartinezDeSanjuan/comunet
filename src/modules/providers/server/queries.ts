import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import {
    findProviderByIdForOffice,
    listProvidersPageByOffice,
    listProviderCategoriesForOffice,
    type PaginationInput,
    type ProviderListFilters,
} from './repository'

async function requireProvidersReadAccess() {
    const session = await requireAuth()

    if (!requirePermission(session, 'providers.read')) {
        throw new Error('FORBIDDEN')
    }

    return session
}

export async function listProvidersQuery(
    filters: ProviderListFilters = {},
    pagination: PaginationInput = {},
) {
    const session = await requireProvidersReadAccess()

    return listProvidersPageByOffice(session.officeId, filters, pagination)
}

export async function getProviderDetailQuery(providerId: string) {
    const session = await requireProvidersReadAccess()

    return findProviderByIdForOffice(providerId, session.officeId)
}

/**
 * Returns distinct provider categories for the current office.
 * Used for pill filter UI on the providers listing page.
 */
export async function getProviderCategoriesQuery() {
    const session = await requireProvidersReadAccess()

    return listProviderCategoriesForOffice(session.officeId)
}
