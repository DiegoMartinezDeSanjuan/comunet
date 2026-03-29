import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react'

import {
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_STATUS_LABELS,
  PortalAlert,
  PortalBadge,
  PortalEmptyState,
  getIncidentPriorityTone,
  getIncidentStatusTone,
} from '@/components/portal/ui'
import { KPICard } from '@/components/ui/kpi-card'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/formatters'
import { createPortalIncidentAction } from '@/modules/portal/server/actions'
import { listPortalIncidents } from '@/modules/portal/server/incidents'
import { listProviderIncidents } from '@/modules/portal/server/provider'
import { PortalIncidentCreateForm } from './portal-incident-create-form'

interface PortalIncidentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PortalIncidentsPage({ searchParams }: PortalIncidentsPageProps) {
  const session = await requireAuth()
  const params = await searchParams
  const error = getSingleParam(params.error)

  // ─── Provider branch ───────────────────────────────────
  if (session.role === 'PROVIDER') {
    const data = await listProviderIncidents(session, {
      communityId: getSingleParam(params.communityId),
      status: getSingleParam(params.status),
      priority: getSingleParam(params.priority),
      search: getSingleParam(params.search),
    })

    const openCount = data.items.filter((i) => !['RESOLVED', 'CLOSED'].includes(i.status)).length
    const resolvedCount = data.items.filter((i) => ['RESOLVED', 'CLOSED'].includes(i.status)).length

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Incidencias asignadas (Proveedor)</h1>
            <p className="mt-1 text-sm text-muted-foreground">Solo se muestran incidencias asignadas a tu cuenta de proveedor. Los comentarios internos del despacho no son visibles.</p>
          </div>
        </div>

        {error ? <PortalAlert variant="error">{error}</PortalAlert> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            label="Total asignadas"
            value={data.items.length}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <KPICard
            label="Activas"
            value={openCount}
            icon={<Wrench className="h-5 w-5" />}
            accent="warning"
          />
          <KPICard
            label="Resueltas"
            value={resolvedCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="success"
          />
        </div>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <form className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
              <div className="space-y-2">
                <label htmlFor="filterSearch" className="text-sm font-medium text-foreground">Buscar</label>
                <input
                  id="filterSearch"
                  name="search"
                  type="text"
                  defaultValue={data.appliedFilters.search ?? ''}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="Título o descripción"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="filterStatus" className="text-sm font-medium text-foreground">Estado</label>
                  <select
                    id="filterStatus"
                    name="status"
                    defaultValue={data.appliedFilters.status ?? ''}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Todos</option>
                    {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="filterPriority" className="text-sm font-medium text-foreground">Prioridad</label>
                  <select
                    id="filterPriority"
                    name="priority"
                    defaultValue={data.appliedFilters.priority ?? ''}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Todas</option>
                    {Object.entries(INCIDENT_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Filtrar</button>
                <Link href="/portal/incidents" className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">Limpiar</Link>
              </div>
            </form>
          </div>

          {data.items.length > 0 ? (
            <div className="space-y-3">
              {data.items.map((incident) => (
                <article key={incident.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <Link
                        href={`/portal/incidents/${incident.id}`}
                        className="text-base font-semibold text-foreground hover:text-primary"
                      >
                        {incident.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {incident.community.name} · {incident.unit?.reference ?? 'Incidencia comunitaria'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PortalBadge tone={getIncidentPriorityTone(incident.priority)}>
                        {INCIDENT_PRIORITY_LABELS[incident.priority] ?? incident.priority}
                      </PortalBadge>
                      <PortalBadge tone={getIncidentStatusTone(incident.status)}>
                        {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                      </PortalBadge>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Reportada: {formatDate(incident.reportedAt)}</span>
                    <span>Comentarios visibles: {incident.sharedCommentCount}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="No hay incidencias para este filtro"
              description="Ajusta la búsqueda o espera a que el despacho te asigne incidencias."
            />
          )}
        </section>
      </div>
    )
  }

  // ─── Owner / President branch ──────────────────────────
  const data = await listPortalIncidents(session, {
    communityId: getSingleParam(params.communityId),
    status: getSingleParam(params.status),
    priority: getSingleParam(params.priority),
    search: getSingleParam(params.search),
  })

  const openCount = data.items.filter((incident) => !['RESOLVED', 'CLOSED'].includes(incident.status)).length
  const urgentCount = data.items.filter((incident) => incident.priority === 'URGENT').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incidencias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta incidencias visibles en tu alcance, revisa comentarios compartidos y crea nuevas incidencias para tus unidades o, si tienes cargo activo de presidencia, a nivel de comunidad.</p>
        </div>
      </div>

      {error ? <PortalAlert variant="error">{error}</PortalAlert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          label="Incidencias visibles"
          value={data.items.length}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPICard
          label="Activas"
          value={openCount}
          icon={<Wrench className="h-5 w-5" />}
          accent="warning"
        />
        <KPICard
          label="Urgentes"
          value={urgentCount}
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="danger"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PortalIncidentCreateForm
          communities={data.composerOptions.communities}
          units={data.composerOptions.units}
        />

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <form className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
              <div className="space-y-2">
                <label htmlFor="filterSearch" className="text-sm font-medium text-foreground">
                  Buscar
                </label>
                <input
                  id="filterSearch"
                  name="search"
                  type="text"
                  defaultValue={data.appliedFilters.search ?? ''}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="Título o descripción"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="filterCommunityId" className="text-sm font-medium text-foreground">
                  Comunidad
                </label>
                <select
                  id="filterCommunityId"
                  name="communityId"
                  defaultValue={data.appliedFilters.communityId ?? ''}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todas las visibles</option>
                  {data.composerOptions.communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="filterStatus" className="text-sm font-medium text-foreground">
                    Estado
                  </label>
                  <select
                    id="filterStatus"
                    name="status"
                    defaultValue={data.appliedFilters.status ?? ''}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Todos</option>
                    {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="filterPriority" className="text-sm font-medium text-foreground">
                    Prioridad
                  </label>
                  <select
                    id="filterPriority"
                    name="priority"
                    defaultValue={data.appliedFilters.priority ?? ''}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Todas</option>
                    {Object.entries(INCIDENT_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Filtrar
                </button>
                <Link
                  href="/portal/incidents"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Limpiar
                </Link>
              </div>
            </form>
          </div>

          {data.items.length > 0 ? (
            <div className="space-y-3">
              {data.items.map((incident) => (
                <article key={incident.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <Link
                        href={`/portal/incidents/${incident.id}`}
                        className="text-base font-semibold text-foreground hover:text-primary"
                      >
                        {incident.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {incident.community.name} · {incident.unit?.reference ?? 'Incidencia comunitaria'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PortalBadge tone={getIncidentPriorityTone(incident.priority)}>
                        {INCIDENT_PRIORITY_LABELS[incident.priority] ?? incident.priority}
                      </PortalBadge>
                      <PortalBadge tone={getIncidentStatusTone(incident.status)}>
                        {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                      </PortalBadge>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Reportada: {formatDate(incident.reportedAt)}</span>
                    <span>Proveedor: {incident.assignedProvider?.name ?? 'Sin asignar'}</span>
                    <span>Comentarios visibles: {incident.sharedCommentCount}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="No hay incidencias para este filtro"
              description="Ajusta la búsqueda o crea una nueva incidencia para una unidad propia o, si aplica, para una comunidad donde tengas presidencia activa."
            />
          )}
        </section>
      </div>
    </div>
  )
}
