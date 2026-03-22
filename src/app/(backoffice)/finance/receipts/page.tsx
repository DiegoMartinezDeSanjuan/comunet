import { requireAuth } from '@/lib/auth'
import {
  findReceiptsPageByOffice,
  type ReceiptFilters,
} from '@/modules/finances/server/receipt-repository'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download, FileText, Plus } from 'lucide-react'

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

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

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

function getStatusClasses(status: string) {
  if (status === 'PAID') return 'bg-success/20 text-success border-success/20'
  if (status === 'PARTIALLY_PAID') return 'bg-cyan-500/20 text-cyan-600 border-cyan-500/20'
  if (status === 'OVERDUE') return 'bg-destructive/10 text-destructive border-destructive/20'
  if (status === 'RETURNED') return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  if (status === 'CANCELLED') return 'bg-muted text-muted-foreground opacity-70 border-border'

  return 'bg-accent text-accent-foreground border-border'
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAuth()
  const params = await searchParams

  const communityId = getSingleParam(params.communityId)
  const status = parseStatus(getSingleParam(params.status))
  const page = parsePositiveInt(getSingleParam(params.page), 1)
  const pageSize = 20

  const filters: ReceiptFilters = {
    communityId,
    status,
  }

  const result = await findReceiptsPageByOffice(session.officeId, filters, {
    page,
    pageSize,
  })

  const receipts = result.items
  const startItem =
    result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const endItem =
    result.total === 0
      ? 0
      : Math.min(result.page * result.pageSize, result.total)

  const buildPageHref = (targetPage: number) => {
    const query = new URLSearchParams()

    if (communityId) query.set('communityId', communityId)
    if (status) query.set('status', status)
    if (targetPage > 1) query.set('page', String(targetPage))

    const queryString = query.toString()
    return queryString
      ? `/finance/receipts?${queryString}`
      : '/finance/receipts'
  }

  const buildCsvHref = () => {
    const query = new URLSearchParams()

    if (communityId) query.set('communityId', communityId)

    const queryString = query.toString()
    return queryString
      ? `/api/exports/receipts?${queryString}`
      : '/api/exports/receipts'
  }

  const csvHref = buildCsvHref()

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recibos Emitidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión global de facturación y cuotas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={csvHref}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </a>

          {['SUPERADMIN', 'OFFICE_ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(
            session.role,
          ) && (
              <Link
                href="/finance/receipts/generate"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Generar Recibos
              </Link>
            )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm text-muted-foreground">
          <p>
            Mostrando {startItem}-{endItem} de {result.total} recibos
          </p>
          <p>
            Página {result.page} de {result.totalPages}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Comunidad
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Referencia
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Emisión
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                  Importe
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                  Cobrado
                </th>
                <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay recibos emitidos registrados.
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle font-medium">
                      {receipt.community.name}
                    </td>

                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{receipt.reference}</span>
                      </div>
                    </td>

                    <td className="p-4 align-middle text-muted-foreground">
                      {new Date(receipt.issueDate).toLocaleDateString()}
                    </td>

                    <td className="p-4 align-middle text-right font-medium">
                      {Number(receipt.amount).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>

                    <td className="p-4 align-middle text-right">
                      {Number(receipt.paidAmount).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>

                    <td className="p-4 align-middle text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(receipt.status)}`}
                      >
                        {receipt.status}
                      </span>
                    </td>

                    <td className="p-4 align-middle text-right">
                      <Link
                        href={`/finance/receipts/${receipt.id}`}
                        className="font-medium text-primary hover:underline"
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

        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {result.total === 0
              ? 'Sin resultados'
              : `Resultados ${startItem}-${endItem} de ${result.total}`}
          </div>

          <div className="flex items-center gap-2">
            {result.hasPreviousPage ? (
              <Link
                href={buildPageHref(result.page - 1)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center justify-center rounded-md border border-input px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </span>
            )}

            {result.hasNextPage ? (
              <Link
                href={buildPageHref(result.page + 1)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center justify-center rounded-md border border-input px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}