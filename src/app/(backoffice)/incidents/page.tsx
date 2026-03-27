import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/permissions'
import { listIncidentsQuery } from '@/modules/incidents/server/queries'

import { IncidentCreateForm } from './incident-create-form'

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

function badgeClasses(value: string): string {
  switch (value) {
    case 'URGENT':
    case 'CLOSED':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'HIGH':
    case 'RESOLVED':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'WAITING_VENDOR':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'ASSIGNED':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'IN_PROGRESS':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700'
    default:
      return 'border-border bg-slate-50 text-muted-foreground'
  }
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

  const [result, communities, providers, creators] = await Promise.all([
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
    prisma.community.findMany({
      where: { officeId: session.officeId, archivedAt: null },
      select: {
        id: true,
        name: true,
        units: {
          where: { active: true },
          select: { id: true, reference: true },
          orderBy: { reference: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.provider.findMany({
      where: { officeId: session.officeId, archivedAt: null },
      select: { id: true, name: true, category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { officeId: session.officeId, archivedAt: null },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ])

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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Incidencias</h1>
        <p className="text-sm text-muted-foreground">
          Gestion operativa de incidencias con filtros, asignacion,
          seguimiento y trazabilidad.
        </p>
      </header>

      {canManage ? (
        <IncidentCreateForm communities={communities} providers={providers} />
      ) : null}

      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Listado</h2>
            <p className="text-sm text-muted-foreground">
              Mostrando {startItem}-{endItem} de {result.total} incidencias.
            </p>
          </div>
        </div>

        <form className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por titulo o descripcion"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />

          <select
            name="communityId"
            defaultValue={communityId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas las comunidades</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>

          <select
            name="providerId"
            defaultValue={providerId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos los proveedores</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            name="priority"
            defaultValue={priority}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas las prioridades</option>
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            name="createdByUserId"
            defaultValue={createdByUserId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos los creadores</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.name} · {creator.role}
              </option>
            ))}
          </select>

          <select
            name="view"
            defaultValue={view}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Abiertas y cerradas</option>
            <option value="open">Solo abiertas</option>
            <option value="closed">Solo cerradas</option>
          </select>

          <select
            name="overdue"
            defaultValue={overdue ? '1' : ''}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Vencidas y no vencidas</option>
            <option value="1">Solo vencidas</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Filtrar
            </button>
            <Link
              href="/incidents"
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              Limpiar
            </Link>
          </div>
        </form>

        {result.items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No se han encontrado incidencias con esos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Incidencia</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Comunidad</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Proveedor</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Prioridad</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Vencimiento</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Ult. actividad</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((incident) => {
                  const overdueItem = isOverdue(incident.dueAt, incident.status)

                  return (
                    <tr key={incident.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Creada por {incident.createdBy.name}
                          {incident.unit ? ` · Unidad ${incident.unit.reference}` : ''}
                        </div>
                      </td>
                      <td className="p-4 align-middle">{incident.community.name}</td>
                      <td className="p-4 align-middle">
                        {incident.assignedProvider ? (
                          <div>
                            <div>{incident.assignedProvider.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {incident.assignedProvider.category || 'Sin categoria'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${badgeClasses(incident.priority)}`}
                        >
                          {incident.priority}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${badgeClasses(incident.status)}`}
                        >
                          {incident.status}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div>{formatDate(incident.dueAt)}</div>
                        {overdueItem ? (
                          <div className="text-xs font-medium text-red-600">
                            Vencida
                          </div>
                        ) : null}
                      </td>
                      <td className="p-4 align-middle">
                        {formatDate(incident.updatedAt)}
                      </td>
                      <td className="p-4 align-middle">
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
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

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Pagina {result.page} de {result.totalPages}
          </div>

          <div className="flex gap-2">
            {result.hasPreviousPage ? (
              <Link
                href={buildHref(result.page - 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                Anterior
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-muted-foreground">
                Anterior
              </span>
            )}

            {result.hasNextPage ? (
              <Link
                href={buildHref(result.page + 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                Siguiente
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-muted-foreground">
                Siguiente
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
