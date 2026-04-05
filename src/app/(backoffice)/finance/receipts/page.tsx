import {
  listReceiptsPageQuery,
  type ReceiptFilters,
} from '@/modules/finances/server/queries'
import { ReceiptStatusBadge } from '@/components/ui/badge'
import { getEffectiveReceiptStatus } from '@/lib/receipt-status'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download, DollarSign, FileText, Plus, Receipt, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const VALID_RECEIPT_STATUSES = [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'RETURNED',
  'CANCELLED',
] as const

type SearchParams = Record<string, string | string[] | undefined>

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.trunc(parsed)
}

function parseStatus(value: string | undefined): ReceiptFilters['status'] {
  if (!value) return undefined
  return VALID_RECEIPT_STATUSES.includes(
    value as (typeof VALID_RECEIPT_STATUSES)[number],
  )
    ? value
    : undefined
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const communityId = getSingleParam(params.communityId)
  const status = parseStatus(getSingleParam(params.status))
  const page = parsePositiveInt(getSingleParam(params.page), 1)
  const pageSize = 20

  const filters: ReceiptFilters = { communityId, status }

  const result = await listReceiptsPageQuery(filters, { page, pageSize })

  const { session } = result
  const canExportReceipts = ['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role)
  const canGenerateReceipts = ['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role)

  const receipts = result.items
  const startItem = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const endItem = result.total === 0 ? 0 : Math.min(result.page * result.pageSize, result.total)

  const paidAmount = receipts.reduce((sum, r) => sum + Number(r.paidAmount), 0)
  const overdueCount = receipts.filter(r => getEffectiveReceiptStatus(r.status, r.dueDate) === 'OVERDUE').length

  const buildPageHref = (targetPage: number) => {
    const query = new URLSearchParams()
    if (communityId) query.set('communityId', communityId)
    if (status) query.set('status', status)
    if (targetPage > 1) query.set('page', String(targetPage))
    const queryString = query.toString()
    return queryString ? `/finance/receipts?${queryString}` : '/finance/receipts'
  }

  const buildCsvHref = () => {
    const query = new URLSearchParams()
    if (communityId) query.set('communityId', communityId)
    if (status) query.set('status', status)
    const queryString = query.toString()
    return queryString ? `/api/exports/receipts?${queryString}` : '/api/exports/receipts'
  }

  const csvHref = buildCsvHref()

  // Pagination: build numbered page array
  const pageNumbers: number[] = []
  for (let i = 1; i <= result.totalPages; i++) {
    if (i <= 2 || i > result.totalPages - 2 || Math.abs(i - result.page) <= 1) {
      pageNumbers.push(i)
    } else if (pageNumbers[pageNumbers.length - 1] !== -1) {
      pageNumbers.push(-1) // ellipsis marker
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recibos Emitidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestión global de facturación y cuotas</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canExportReceipts && (
            <a
              href={csvHref}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2.5 text-sm font-medium hover:bg-card/80 hover:border-border transition-all"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </a>
          )}
          {canGenerateReceipts && (
            <Link
              href="/finance/receipts/generate"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Generar Recibos
            </Link>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{result.total}</p>
            <p className="text-xs text-muted-foreground">Total recibos</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {paidAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-muted-foreground">Cobrado en vista</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">Vencidos</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3 text-sm text-muted-foreground">
          <p>Mostrando {startItem}-{endItem} de {result.total} recibos</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/10">
                <th className="h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comunidad</th>
                <th className="h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referencia</th>
                <th className="h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emisión</th>
                <th className="h-11 px-5 text-right align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Importe</th>
                <th className="h-11 px-5 text-right align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cobrado</th>
                <th className="h-11 px-5 text-center align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="h-11 px-5 text-right align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No hay recibos emitidos registrados.</p>
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-border/30 transition-colors hover:bg-muted/10">
                    <td className="p-4 align-middle font-medium">{receipt.community.name}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">{receipt.reference}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {new Date(receipt.issueDate).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-4 align-middle text-right font-medium">
                      {Number(receipt.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="p-4 align-middle text-right">
                      {Number(receipt.paidAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <ReceiptStatusBadge status={getEffectiveReceiptStatus(receipt.status, receipt.dueDate)} />
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link
                        href={`/finance/receipts/${receipt.id}`}
                        className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        Ver Detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <div className="flex items-center justify-between gap-4 border-t border-border/50 px-5 py-3">
          <div className="text-sm text-muted-foreground">
            {result.total === 0 ? 'Sin resultados' : `Resultados ${startItem}-${endItem} de ${result.total}`}
          </div>
          <div className="flex items-center gap-1">
            {result.hasPreviousPage ? (
              <Link href={buildPageHref(result.page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
            {pageNumbers.map((p, i) =>
              p === -1 ? (
                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">…</span>
              ) : (
                <Link
                  key={p}
                  href={buildPageHref(p)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === result.page
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border/50 bg-card/50 hover:bg-muted/30'
                  }`}
                >
                  {p}
                </Link>
              )
            )}
            {result.hasNextPage ? (
              <Link href={buildPageHref(result.page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
