import Link from 'next/link'
import { Search, Filter } from 'lucide-react'

import { listIncidentsQuery, getIncidentFilterOptionsQuery } from '@/modules/incidents/server/queries'
import { requirePermission } from '@/lib/permissions'
import { requireAuth } from '@/lib/auth'
import { PriorityBadge, StatusBadge } from '@/components/ui/badge'

import { IncidentCreateDialog } from '@/modules/incidents/components/incident-create-dialog'

export const dynamic = 'force-dynamic'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
const STATUSES = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_VENDOR',
  'RESOLVED',
  'CLOSED',
] as const

type SearchParams = Record<string, string | string[] | undefined>

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.trunc(parsed)
}

function formatDate(value: Date | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-ES')
}

function isOverdue(dueAt: Date | null, status: string): boolean {
  if (!dueAt) return false
  if (status === 'RESOLVED' || status === 'CLOSED') return false
  return dueAt.getTime() < Date.now()
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAuth()
  const params = await searchParams

  const q = getParam(params.q)
  const communityId = getParam(params.communityId)
  const providerId = getParam(params.providerId)
  const status = getParam(params.status)
  const priority = getParam(params.priority)
  const createdByUserId = getParam(params.createdByUserId)
  const overdue = getParam(params.overdue) === '1'
  const view = getParam(params.view)
  const page = parsePositiveInt(getParam(params.page), 1)
  const pageSize = 20

  const [result, filterOptions] = await Promise.all([
    listIncidentsQuery(
      {
        search: q || undefined,
        communityId: communityId || undefined,
        providerId: providerId || undefined,
        status: STATUSES.includes(status as (typeof STATUSES)[number])
          ? (status as (typeof STATUSES)[number])
          : undefined,
        priority: PRIORITIES.includes(priority as (typeof PRIORITIES)[number])
          ? (priority as (typeof PRIORITIES)[number])
          : undefined,
        createdByUserId: createdByUserId || undefined,
        overdue: overdue || undefined,
        openOnly: view === 'open' ? true : undefined,
        closedOnly: view === 'closed' ? true : undefined,
      },
      { page, pageSize },
    ),
    getIncidentFilterOptionsQuery(),
  ])

  const { communities, providers } = filterOptions

  const canManage = requirePermission(session, 'incidents.manage')

  const startItem = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const endItem = result.total === 0 ? 0 : Math.min(result.page * result.pageSize, result.total)

  const buildHref = (targetPage: number) => {
    const query = new URLSearchParams()
    if (q) query.set('q', q)
    if (communityId) query.set('communityId', communityId)
    if (providerId) query.set('providerId', providerId)
    if (status) query.set('status', status)
    if (priority) query.set('priority', priority)
    if (createdByUserId) query.set('createdByUserId', createdByUserId)
    if (overdue) query.set('overdue', '1')
    if (view) query.set('view', view)
    if (targetPage > 1) query.set('page', String(targetPage))
    const search = query.toString()
    return search ? `/incidents?${search}` : '/incidents'
  }

  // Generate page numbers for pagination
  const pageNumbers: number[] = []
  for (let i = Math.max(1, result.page - 2); i <= Math.min(result.totalPages, result.page + 2); i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-sm text-muted-foreground">
            Supervisa y gestiona las solicitudes de mantenimiento y reparaciones.
          </p>
        </div>
        {canManage ? (
          <IncidentCreateDialog communities={communities} providers={providers} />
        ) : null}
      </header>

      {/* Filters */}
      <form className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar incidencia..."
              className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            name="communityId"
            defaultValue={communityId}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">Comunidad</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[130px]"
          >
            <option value="">Estado</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            name="priority"
            defaultValue={priority}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[130px]"
          >
            <option value="">Prioridad</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Filter className="h-4 w-4" />
              Filtrar
            </button>
            <Link
              href="/incidents"
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30"
            >
              Limpiar
            </Link>
          </div>
        </div>
      </form>

      {/* Results */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {startItem}–{endItem} de {result.total} incidencias
          </p>
        </div>

        {result.items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No se han encontrado incidencias con esos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Incidencia</th>
                  <th className="px-5 py-3 font-medium">Comunidad</th>
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 font-medium">Prioridad</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Vencimiento</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((incident) => {
                  const overdueItem = isOverdue(incident.dueAt, incident.status)
                  return (
                    <tr
                      key={incident.id}
                      className="border-b border-border/20 transition-colors hover:bg-muted/10"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {incident.createdBy.name}
                          {incident.unit ? ` · ${incident.unit.reference}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3">{incident.community.name}</td>
                      <td className="px-5 py-3">
                        {incident.assignedProvider ? (
                          <div>
                            <div>{incident.assignedProvider.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {incident.assignedProvider.category || ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <PriorityBadge priority={incident.priority} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div>{formatDate(incident.dueAt)}</div>
                        {overdueItem ? (
                          <div className="text-xs font-semibold text-red-400">Vencida</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Página {result.page} de {result.totalPages}
          </p>
          <div className="flex items-center gap-1">
            {result.hasPreviousPage ? (
              <Link
                href={buildHref(result.page - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-muted/30"
              >
                ‹
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground">
                ‹
              </span>
            )}

            {pageNumbers.map((pn) => (
              <Link
                key={pn}
                href={buildHref(pn)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  pn === result.page
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-muted/30'
                }`}
              >
                {pn}
              </Link>
            ))}

            {result.hasNextPage ? (
              <Link
                href={buildHref(result.page + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-muted/30"
              >
                ›
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground">
                ›
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
