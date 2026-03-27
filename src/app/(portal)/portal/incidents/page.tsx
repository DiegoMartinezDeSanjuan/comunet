import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ShieldCheck, Wrench } from 'lucide-react'

import {
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_STATUS_LABELS,
  PortalAlert,
  PortalBadge,
  PortalEmptyState,
  PortalPageHeader,
  PortalStatCard,
  getIncidentPriorityTone,
  getIncidentStatusTone,
} from '@/components/portal/ui'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/formatters'
import { createPortalIncidentAction } from '@/modules/portal/server/actions'
import { listPortalIncidents } from '@/modules/portal/server/incidents'

interface PortalIncidentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PortalIncidentsPage({ searchParams }: PortalIncidentsPageProps) {
  const session = await requireAuth()

  if (session.role === 'PROVIDER') {
    redirect('/portal')
  }

  const params = await searchParams
  const data = await listPortalIncidents(session, {
    communityId: getSingleParam(params.communityId),
    status: getSingleParam(params.status),
    priority: getSingleParam(params.priority),
    search: getSingleParam(params.search),
  })

  const error = getSingleParam(params.error)
  const openCount = data.items.filter((incident) => !['RESOLVED', 'CLOSED'].includes(incident.status)).length
  const urgentCount = data.items.filter((incident) => incident.priority === 'URGENT').length

  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Portal"
        title="Incidencias"
        description="Consulta incidencias visibles en tu alcance, revisa comentarios compartidos y crea nuevas incidencias para tus unidades o, si tienes cargo activo de presidencia, a nivel de comunidad."
      />

      {error ? <PortalAlert variant="error">{error}</PortalAlert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard
          label="Incidencias visibles"
          value={String(data.items.length)}
          hint="Resultado del filtro actual en el portal."
          icon={AlertTriangle}
        />
        <PortalStatCard
          label="Activas"
          value={String(openCount)}
          hint="Abiertas, asignadas, en curso o esperando proveedor."
          icon={Wrench}
        />
        <PortalStatCard
          label="Urgentes"
          value={String(urgentCount)}
          hint="Prioridad URGENT dentro del alcance actual."
          icon={ShieldCheck}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Alta de incidencia</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El servidor valida siempre el alcance por unidad o por presidencia activa antes de crear la incidencia.
            </p>
          </div>

          <form action={createPortalIncidentAction} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label htmlFor="communityId" className="text-sm font-medium text-foreground">
                Comunidad
              </label>
              <select
                id="communityId"
                name="communityId"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecciona una comunidad</option>
                {data.composerOptions.communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                    {community.canCreateCommunityIncident ? ' · Presidencia activa' : ''}
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
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Incidencia comunitaria (solo presidencia activa)</option>
                {data.composerOptions.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.communityName} · {unit.reference}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Si no eliges unidad, el alta solo se aceptará cuando exista cargo activo de presidencia en la comunidad seleccionada.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Título
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                minLength={3}
                maxLength={160}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                placeholder="Describe brevemente la incidencia"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Añade contexto, ubicación exacta o cualquier dato útil para el seguimiento"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium text-foreground">
                  Prioridad
                </label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="MEDIUM"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(INCIDENT_PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="dueAt" className="text-sm font-medium text-foreground">
                  Fecha objetivo
                </label>
                <input
                  id="dueAt"
                  name="dueAt"
                  type="date"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Crear incidencia
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <form className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
              <div className="space-y-2">
                <label htmlFor="search" className="text-sm font-medium text-foreground">
                  Buscar
                </label>
                <input
                  id="search"
                  name="search"
                  type="text"
                  defaultValue={data.appliedFilters.search ?? ''}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="Título o descripción"
                />
              </div>

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
                    {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium text-foreground">
                    Prioridad
                  </label>
                  <select
                    id="priority"
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
