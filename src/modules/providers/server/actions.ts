'use server'

import { revalidatePath } from 'next/cache'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import type { ProviderInput, UpdateProviderInput } from '@/modules/providers/schema'
import { createProvider, updateProvider } from './services'

async function getOfficeAndUser(permission: string) {
    const session = await requireAuth()

    if (!requirePermission(session, permission)) {
        throw new Error('FORBIDDEN')
    }

    return {
        officeId: session.officeId,
        userId: session.userId,
    }
}

export async function createProviderAction(input: ProviderInput) {
    const { officeId, userId } = await getOfficeAndUser('providers.manage')

    const provider = await createProvider(officeId, userId, input)

    revalidatePath('/providers')

    return provider
}

export async function updateProviderAction(
    providerId: string,
    input: UpdateProviderInput,
) {
    const { officeId, userId } = await getOfficeAndUser('providers.manage')

    const provider = await updateProvider(officeId, userId, providerId, input)

    revalidatePath('/providers')
    revalidatePath(`/providers/${provider.id}`)

    return provider
}
