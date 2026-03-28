import 'server-only'
import { prisma } from '@/lib/db'
import type { AuditAction } from '@prisma/client'

interface AuditEntry {
  officeId: string
  userId: string
  entityType: string
  entityId: string
  action: AuditAction
  meta?: Record<string, unknown>
}

/**
 * Fire-and-forget audit logging.
 *
 * The INSERT is executed asynchronously without awaiting.
 * This removes ~5-10ms latency from every request that logs audits.
 * If the insert fails, the error is logged to stderr but does NOT
 * propagate to the caller — auditing should never break business logic.
 */
export function logAudit(entry: AuditEntry): void {
  prisma.auditLog
    .create({
      data: {
        officeId: entry.officeId,
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        metaJson: entry.meta ? JSON.stringify(entry.meta) : null,
      },
    })
    .catch((err) => {
      console.error('[AUDIT] Failed to write audit log:', err, {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
      })
    })
}
