import 'server-only'

import { prisma } from '@/lib/db'
import { logAudit } from '@/modules/audit/server/services'
import type { ProviderInput, UpdateProviderInput } from '@/modules/providers/schema'
import { providerSchema, updateProviderSchema } from '@/modules/providers/schema'
import {
    createProviderRecord,
    findProviderByIdForOffice,
    updateProviderRecord,
} from './repository'

export async function createProvider(
    officeId: string,
    userId: string,
    input: ProviderInput,
) {
    const parsed = providerSchema.parse(input)

    const provider = await createProviderRecord({
        officeId,
        name: parsed.name,
        cif: parsed.cif ?? null,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        category: parsed.category ?? null,
        address: parsed.address ?? null,
        notes: parsed.notes ?? null,
    })

    logAudit({
        officeId,
        userId,
        entityType: 'PROVIDER',
        entityId: provider.id,
        action: 'CREATE',
        meta: {
            name: provider.name,
            category: provider.category,
        },
    })

    return provider
}

export async function updateProvider(
    officeId: string,
    userId: string,
    providerId: string,
    input: UpdateProviderInput,
) {
    const parsed = updateProviderSchema.parse(input)

    const current = await findProviderByIdForOffice(providerId, officeId)

    if (!current) {
        throw new Error('Proveedor no encontrado')
    }

    const archivedAt = parsed.archived === undefined
        ? current.provider.archivedAt
        : parsed.archived
            ? current.provider.archivedAt ?? new Date()
            : null

    const provider = await updateProviderRecord(providerId, {
        name: parsed.name,
        cif: parsed.cif ?? null,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        category: parsed.category ?? null,
        address: parsed.address ?? null,
        notes: parsed.notes ?? null,
        archivedAt,
    })

    logAudit({
        officeId,
        userId,
        entityType: 'PROVIDER',
        entityId: provider.id,
        action: parsed.archived === true ? 'ARCHIVE' : 'UPDATE',
        meta: {
            previous: {
                name: current.provider.name,
                category: current.provider.category,
                archivedAt: current.provider.archivedAt?.toISOString() ?? null,
            },
            next: {
                name: provider.name,
                category: provider.category,
                archivedAt: provider.archivedAt?.toISOString() ?? null,
            },
        },
    })

    return provider
}

export async function assertProviderAvailableInOffice(
    officeId: string,
    providerId: string,
) {
    const provider = await prisma.provider.findFirst({
        where: {
            id: providerId,
            officeId,
        },
    })

    if (!provider) {
        throw new Error('Proveedor fuera de alcance')
    }

    if (provider.archivedAt) {
        throw new Error('No se puede asignar un proveedor archivado')
    }

    return provider
}
