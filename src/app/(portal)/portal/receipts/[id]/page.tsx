import { notFound, redirect } from 'next/navigation'
import { Receipt, Wallet, CheckCircle2 } from 'lucide-react'

import {
  BackLink,
  PortalBadge,
  getReceiptStatusTone,
  RECEIPT_STATUS_LABELS,
} from '@/modules/portal/components/ui'
import { KPICard } from '@/components/ui/kpi-card'
import { requireAuth } from '@/lib/auth'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { getPortalReceiptDetail } from '@/modules/portal/server/receipts'
import { toNumber } from '@/modules/portal/server/utils'

interface PortalReceiptDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PortalReceiptDetailPage({ params }: PortalReceiptDetailPageProps) {
  const session = await requireAuth()

  if (session.role === 'PROVIDER') {
    redirect('/portal')
  }

  const { id } = await params
  const receipt = await getPortalReceiptDetail(session, id)

  if (!receipt) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{receipt.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{receipt.community.name} · Unidad {receipt.unit.reference} · Emitido el {formatDate(receipt.issueDate)}</p>
        </div>
        <BackLink href="/portal/receipts">Volver a recibos</BackLink>
      </div>
      <div className="flex flex-wrap gap-2">
        <PortalBadge tone={getReceiptStatusTone(receipt.status)}>
          {RECEIPT_STATUS_LABELS[receipt.status] ?? receipt.status}
        </PortalBadge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          label="Importe total"
          value={formatCurrency(receipt.amountValue)}
          icon={<Receipt className="h-5 w-5" />}
        />
        <KPICard
          label="Pagado"
          value={formatCurrency(receipt.paidAmountValue)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
        <KPICard
          label="Saldo pendiente"
          value={formatCurrency(receipt.pendingBalance)}
          icon={<Wallet className="h-5 w-5" />}
          accent="warning"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Detalle del recibo</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Comunidad</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{receipt.community.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Unidad</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {receipt.unit.reference}
                {receipt.unit.building?.name ? ` · ${receipt.unit.building.name}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Titular</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{receipt.owner.fullName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Estado</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {RECEIPT_STATUS_LABELS[receipt.status] ?? receipt.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Periodo</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {formatDate(receipt.periodStart)} – {formatDate(receipt.periodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Vencimiento</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(receipt.dueDate)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Resumen financiero</h2>
          <dl className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Importe emitido</dt>
              <dd className="font-medium text-foreground">{formatCurrency(receipt.amountValue)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Pagado registrado</dt>
              <dd className="font-medium text-foreground">{formatCurrency(receipt.paymentTotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Saldo pendiente</dt>
              <dd className="font-medium text-foreground">{formatCurrency(receipt.pendingBalance)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Deuda asociada</dt>
              <dd className="font-medium text-foreground">{formatCurrency(receipt.debtOutstanding)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pagos asociados</h2>
          <p className="text-sm text-muted-foreground">Movimientos registrados sobre este recibo.</p>
        </div>

        {receipt.payments.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Método</th>
                    <th className="px-4 py-3 font-medium">Referencia</th>
                    <th className="px-4 py-3 font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {receipt.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-foreground">{formatDateTime(payment.paymentDate)}</td>
                      <td className="px-4 py-3 text-foreground">{payment.method}</td>
                      <td className="px-4 py-3 text-muted-foreground">{payment.reference || '—'}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(toNumber(payment.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            Aún no hay pagos registrados para este recibo.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Deuda y saldo</h2>
          <p className="text-sm text-muted-foreground">Detalle de deuda asociada al recibo, cuando exista.</p>
        </div>

        {receipt.debts.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Creada</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Principal</th>
                    <th className="px-4 py-3 font-medium">Recargo</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {receipt.debts.map((debt) => {
                    const total = toNumber(debt.principal) + toNumber(debt.surcharge)

                    return (
                      <tr key={debt.id}>
                        <td className="px-4 py-3 text-foreground">{formatDate(debt.createdAt)}</td>
                        <td className="px-4 py-3 text-foreground">{debt.status}</td>
                        <td className="px-4 py-3 text-foreground">{formatCurrency(toNumber(debt.principal))}</td>
                        <td className="px-4 py-3 text-foreground">{formatCurrency(toNumber(debt.surcharge))}</td>
                        <td className="px-4 py-3 text-foreground">{formatCurrency(total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            Este recibo no tiene deuda asociada en este momento.
          </div>
        )}
      </section>
    </div>
  )
}
