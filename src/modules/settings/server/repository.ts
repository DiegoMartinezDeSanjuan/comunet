import 'server-only'

import { prisma } from '@/lib/db'

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
