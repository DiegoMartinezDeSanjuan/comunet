import 'server-only'

import { prisma } from '@/lib/db'

/**
 * Minimal user list for filter dropdowns (e.g. "Created by" in incidents).
 * Only active (non-archived) users in the office.
 */
export async function listUserOptionsForOffice(officeId: string) {
    return prisma.user.findMany({
        where: { officeId, archivedAt: null },
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' },
    })
}
