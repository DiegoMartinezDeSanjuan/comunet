import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const RECEIPT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitido',
  PARTIALLY_PAID: 'Parcialmente pagado',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  RETURNED: 'Devuelto',
  CANCELLED: 'Cancelado',
}

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierta',
  ASSIGNED: 'Asignada',
  IN_PROGRESS: 'En curso',
  WAITING_VENDOR: 'Esperando proveedor',
  RESOLVED: 'Resuelta',
  CLOSED: 'Cerrada',
}

export const INCIDENT_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export const MEETING_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  HELD: 'Celebrada',
  CLOSED: 'Cerrada',
}

function getToneClasses(tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info') {
  if (tone === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  if (tone === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
  }

  if (tone === 'danger') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
  }

  if (tone === 'info') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300'
  }

  return 'border-border bg-muted/40 text-foreground'
}

export function getReceiptStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'PAID') return 'success'
  if (status === 'PARTIALLY_PAID') return 'warning'
  if (status === 'OVERDUE' || status === 'RETURNED') return 'danger'
  if (status === 'ISSUED') return 'info'
  return 'neutral'
}

export function getIncidentStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success'
  if (status === 'WAITING_VENDOR') return 'warning'
  if (status === 'OPEN') return 'danger'
  if (status === 'ASSIGNED' || status === 'IN_PROGRESS') return 'info'
  return 'neutral'
}

export function getIncidentPriorityTone(priority: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (priority === 'URGENT') return 'danger'
  if (priority === 'HIGH') return 'warning'
  if (priority === 'MEDIUM') return 'info'
  return 'neutral'
}



interface PortalEmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function PortalEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: PortalEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto max-w-2xl space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      {actionLabel && actionHref ? (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

interface PortalBadgeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
  className?: string
}

export function PortalBadge({ tone = 'neutral', children, className }: PortalBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        getToneClasses(tone),
        className,
      )}
    >
      {children}
    </span>
  )
}

interface PortalAlertProps {
  variant?: 'info' | 'success' | 'error'
  children: ReactNode
}

export function PortalAlert({ variant = 'info', children }: PortalAlertProps) {
  const tone = variant === 'success' ? 'success' : variant === 'error' ? 'danger' : 'info'

  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm', getToneClasses(tone))}>
      {children}
    </div>
  )
}

interface BackLinkProps {
  href: string
  children: ReactNode
}

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span aria-hidden="true">←</span>
      <span>{children}</span>
    </Link>
  )
}
