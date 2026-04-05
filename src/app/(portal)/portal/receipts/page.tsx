import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Receipt, Wallet, AlertCircle } from 'lucide-react'

import {
  PortalBadge,
  PortalEmptyState,
  getReceiptStatusTone,
  RECEIPT_STATUS_LABELS,
} from '@/modules/portal/components/ui'
import { KPICard } from '@/components/ui/kpi-card'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getPortalReceiptsPageQuery } from '@/modules/portal/server/receipts'

interface PortalReceiptsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PortalReceiptsPage({ searchParams }: PortalReceiptsPageProps) {
  const params = await searchParams
  const data = await getPortalReceiptsPageQuery({
    communityId: getSingleParam(params.communityId),
    unitId: getSingleParam(params.unitId),
    status: getSingleParam(params.status),
    period: getSingleParam(params.period),
  })

  if (data.session.role === 'PROVIDER') {
    redirect('/portal')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recibos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta tus recibos autorizados, filtra por comunidad, unidad, estado o periodo y revisa el saldo pendiente sin salir del portal.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          label="Recibos visibles"
          value={data.summary.totalCount}
          icon={<Receipt className="h-5 w-5" />}
        />
        <KPICard
          label="Saldo pendiente"
          value={formatCurrency(data.summary.pendingTotal)}
          icon={<Wallet className="h-5 w-5" />}
          accent="warning"
        />
        <KPICard
          label="Recibos vencidos"
          value={data.summary.overdueCount}
          icon={<AlertCircle className="h-5 w-5" />}
          accent="danger"
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <form className="grid gap-4 lg:grid-cols-[1.3fr_1.3fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <label htmlFor="communityId" className="text-sm font-medium text-foreground">
              Comunidad
            </label>
            <select
              id="communityId"
              name="communityId"
              defaultValue={data.appliedFilters.communityId ?? ''}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Todas tus comunidades</option>
              {data.scope?.ownedCommunities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="unitId" className="text-sm font-medium text-foreground">
              Unidad
            </label>
            <select
              id="unitId"
              name="unitId"
              defaultValue={data.appliedFilters.unitId ?? ''}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Todas tus unidades</option>
              {data.scope?.ownedUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.communityName} · {unit.reference}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={data.appliedFilters.status ?? ''}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(RECEIPT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="period" className="text-sm font-medium text-foreground">
              Periodo
            </label>
            <input
              id="period"
              name="period"
              type="month"
              defaultValue={data.appliedFilters.period ?? ''}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Filtrar
            </button>
            <Link
              href="/portal/receipts"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Limpiar
            </Link>
          </div>
        </form>
      </section>

      {data.items.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Recibo</th>
                  <th className="px-4 py-3 font-medium">Comunidad</th>
                  <th className="px-4 py-3 font-medium">Periodo</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Importe</th>
                  <th className="px-4 py-3 font-medium">Pendiente</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.items.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-foreground">{receipt.reference}</div>
                      <div className="text-xs text-muted-foreground">Unidad {receipt.unit.reference}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-foreground">{receipt.community.name}</td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {formatDate(receipt.periodStart)} – {formatDate(receipt.periodEnd)}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{formatDate(receipt.dueDate)}</td>
                    <td className="px-4 py-3 align-top">
                      <PortalBadge tone={getReceiptStatusTone(receipt.status)}>
                        {RECEIPT_STATUS_LABELS[receipt.status] ?? receipt.status}
                      </PortalBadge>
                    </td>
                    <td className="px-4 py-3 align-top text-foreground">{formatCurrency(receipt.amountValue)}</td>
                    <td className="px-4 py-3 align-top text-foreground">{formatCurrency(receipt.pendingBalance)}</td>
                    <td className="px-4 py-3 align-top text-right">
                      <Link href={`/portal/receipts/${receipt.id}`} className="text-sm font-medium text-primary hover:underline">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <PortalEmptyState
          title="No hay recibos para este filtro"
          description="Ajusta la comunidad, la unidad, el estado o el periodo para localizar tus recibos. Si todavía no existen recibos emitidos para tus unidades, aparecerán aquí cuando estén disponibles."
        />
      )}
    </div>
  )
}
