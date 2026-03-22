import 'server-only'
import { prisma } from '@/lib/db'
// import type { AuditAction } from '@prisma/client'
interface AuditEntry {
  officeId: string
  userId: string
  entityType: string
  entityId: string
  action: any // Temporarily any
  meta?: Record<string, unknown>
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      officeId: entry.officeId,
      userId: entry.userId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      metaJson: entry.meta ? JSON.stringify(entry.meta) : null,
    },
  })
}
