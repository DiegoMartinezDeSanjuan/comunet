import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Receipt, Wallet, AlertCircle } from 'lucide-react'

import {
  PortalBadge,
  PortalEmptyState,
  PortalPageHeader,
  PortalStatCard,
  getReceiptStatusTone,
  RECEIPT_STATUS_LABELS,
} from '@/components/portal/ui'
import { requireAuth } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { listPortalReceipts } from '@/modules/portal/server/receipts'

interface PortalReceiptsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PortalReceiptsPage({ searchParams }: PortalReceiptsPageProps) {
  const session = await requireAuth()

  if (session.role === 'PROVIDER') {
    redirect('/portal')
  }

  const params = await searchParams
  const data = await listPortalReceipts(session, {
    communityId: getSingleParam(params.communityId),
    unitId: getSingleParam(params.unitId),
    status: getSingleParam(params.status),
    period: getSingleParam(params.period),
  })

  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Portal"
        title="Recibos"
        description="Consulta tus recibos autorizados, filtra por comunidad, unidad, estado o periodo y revisa el saldo pendiente sin salir del portal."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard
          label="Recibos visibles"
          value={String(data.summary.totalCount)}
          hint="Resultado del filtro actual."
          icon={Receipt}
        />
        <PortalStatCard
          label="Saldo pendiente"
          value={formatCurrency(data.summary.pendingTotal)}
          hint="Suma de importes aún no liquidados en este listado."
          icon={Wallet}
        />
        <PortalStatCard
          label="Recibos vencidos"
          value={String(data.summary.overdueCount)}
          hint="Necesitan seguimiento o revisión de cobro."
          icon={AlertCircle}
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
