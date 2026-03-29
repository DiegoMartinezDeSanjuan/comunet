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
 * Actions that must be audited synchronously (guaranteed write).
 * These cover security-sensitive and financially-relevant operations
 * where losing the audit trail is unacceptable.
 */
const SYNC_AUDIT_ACTIONS: Set<AuditAction> = new Set([
  'LOGIN',
  'CREATE',  // User creation includes role assignment
  'UPDATE',  // User updates include role/permission changes
  'DELETE',  // Irrecoverable actions
  'ARCHIVE', // Soft-delete is also sensitive
])

/**
 * Entity types that always require synchronous audit regardless of action.
 */
const SYNC_AUDIT_ENTITIES: Set<string> = new Set([
  'user',      // Login, role changes
  'payment',   // Financial operations
  'receipt',   // Financial operations
  'debt',      // Financial operations
  'budget',    // Financial operations
  'office',    // Settings changes
])

function requiresSyncAudit(entry: AuditEntry): boolean {
  const typeLower = entry.entityType.toLowerCase()
  if (SYNC_AUDIT_ENTITIES.has(typeLower)) return true
  if (SYNC_AUDIT_ACTIONS.has(entry.action) && typeLower === 'user') return true
  return false
}

/**
 * Audit logging with selective sync/async behavior.
 *
 * - **Sync** (guaranteed): Login, user management, financial operations.
 *   The INSERT is awaited. If it fails, the error propagates.
 *
 * - **Async** (best-effort): CRUD on communities, incidents, documents, etc.
 *   The INSERT is fire-and-forget. Failures are logged to stderr
 *   but do NOT propagate — auditing should never break general business logic.
 *
 * Use `logAuditSync()` to force synchronous behavior for custom cases.
 */
export function logAudit(entry: AuditEntry): void | Promise<void> {
  if (requiresSyncAudit(entry)) {
    return logAuditSync(entry)
  }

  // Fire-and-forget for non-sensitive operations
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

/**
 * Force synchronous audit logging. Use for operations where the
 * audit trail MUST be written before the response is sent.
 */
export async function logAuditSync(entry: AuditEntry): Promise<void> {
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
