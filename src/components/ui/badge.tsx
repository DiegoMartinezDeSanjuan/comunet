import { cn } from '@/lib/utils'

/* ── Priority Badge ─────────────────────────────────────── */

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'bg-red-500/15 text-red-400 border-red-500/30',
  HIGH:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  LOW:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgente',
  HIGH:   'Alta',
  MEDIUM: 'Media',
  LOW:    'Baja',
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW,
      )}
    >
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  )
}

/* ── Status Badge ───────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  OPEN:           'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ASSIGNED:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  IN_PROGRESS:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  WAITING_VENDOR: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  RESOLVED:       'bg-green-500/15 text-green-400 border-green-500/30',
  CLOSED:         'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN:           'Abierta',
  ASSIGNED:       'Asignada',
  IN_PROGRESS:    'En curso',
  WAITING_VENDOR: 'Esp. proveedor',
  RESOLVED:       'Resuelta',
  CLOSED:         'Cerrada',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

/* ── Receipt Status Badge ───────────────────────────────── */

const RECEIPT_STYLES: Record<string, string> = {
  DRAFT:          'bg-slate-500/15 text-slate-400 border-slate-500/30',
  ISSUED:         'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PARTIALLY_PAID: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PAID:           'bg-green-500/15 text-green-400 border-green-500/30',
  OVERDUE:        'bg-red-500/15 text-red-400 border-red-500/30',
  RETURNED:       'bg-purple-500/15 text-purple-400 border-purple-500/30',
  CANCELLED:      'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const RECEIPT_LABELS: Record<string, string> = {
  DRAFT:          'Borrador',
  ISSUED:         'Emitido',
  PARTIALLY_PAID: 'Parcial',
  PAID:           'Pagado',
  OVERDUE:        'Vencido',
  RETURNED:       'Devuelto',
  CANCELLED:      'Cancelado',
}

export function ReceiptStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        RECEIPT_STYLES[status] ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {RECEIPT_LABELS[status] ?? status}
    </span>
  )
}
