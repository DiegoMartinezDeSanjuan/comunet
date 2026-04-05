import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import {
  getIncidentDetailWithOptionsQuery,
} from '@/modules/incidents/server/queries'

import { IncidentDetailActions } from './incident-detail-actions'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

function formatDateTime(value: Date | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-ES')
}

function formatBadgeClasses(value: string): string {
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

type TimelineEntry = Awaited<ReturnType<typeof getIncidentDetailWithOptionsQuery>>['timeline'][number]

function describeTimelineEntry(entry: TimelineEntry): string {
  if (entry.kind === 'COMMENT') {
    return `Comentario ${entry.visibility}`
  }

  const meta = entry.meta as Record<string, unknown> | null

  if (entry.action === 'CREATE' && meta?.type === 'INCIDENT_COMMENT') {
    return 'Comentario registrado'
  }

  if (entry.action === 'CREATE') {
    return 'Incidencia creada'
  }

  if (entry.action === 'STATUS_CHANGE') {
    const previousStatus = typeof meta?.previousStatus === 'string' ? meta.previousStatus : null
    const nextStatus = typeof meta?.nextStatus === 'string' ? meta.nextStatus : null

    if (previousStatus && nextStatus) {
      return `Cambio de estado: ${previousStatus} -> ${nextStatus}`
    }

    return 'Estado actualizado'
  }

  if (meta?.type === 'PROVIDER_ASSIGNMENT') {
    const previousProviderId = typeof meta.previousProviderId === 'string' ? meta.previousProviderId : null
    const nextProviderId = typeof meta.nextProviderId === 'string' ? meta.nextProviderId : null

    if (previousProviderId && nextProviderId && previousProviderId !== nextProviderId) {
      return 'Proveedor reasignado'
    }

    return 'Proveedor asignado'
  }

  if (entry.action === 'UPDATE') {
    return 'Incidencia actualizada'
  }

  return entry.action
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const session = await requireAuth()
  const { id } = await params

  const { incident, timeline, providerOptions } = await getIncidentDetailWithOptionsQuery(id)

  if (!incident) {
    notFound()
  }

  const canManage = requirePermission(session, 'incidents.manage')
  const visibleTimeline = timeline.filter((entry) => {
    if (entry.kind !== 'AUDIT') return true
    const meta = entry.meta as Record<string, unknown> | null
    return meta?.type !== 'INCIDENT_COMMENT'
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Volver a incidencias
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{incident.title}</h1>
        <p className="text-sm text-muted-foreground">
          Comunidad {incident.community.name}
          {incident.unit ? ` · Unidad ${incident.unit.reference}` : ''}
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Estado</div>
          <div className="mt-2">
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${formatBadgeClasses(incident.status)}`}
            >
              {incident.status}
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Prioridad</div>
          <div className="mt-2">
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${formatBadgeClasses(incident.priority)}`}
            >
              {incident.priority}
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Proveedor</div>
          <div className="mt-2 text-sm font-medium">
            {incident.assignedProvider?.name || 'Sin asignar'}
          </div>
          <div className="text-xs text-muted-foreground">
            {incident.assignedProvider?.category || '-'}
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Fechas</div>
          <div className="mt-2 space-y-1 text-sm">
            <div>Reportada: {formatDateTime(incident.reportedAt)}</div>
            <div>Vence: {formatDateTime(incident.dueAt)}</div>
            <div>Resuelta: {formatDateTime(incident.resolvedAt)}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Resumen</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <div className="font-medium">Descripción</div>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {incident.description || 'Sin descripción adicional.'}
                </p>
              </div>
              <div>
                <div className="font-medium">Creada por</div>
                <p className="mt-1 text-muted-foreground">
                  {incident.createdBy.name} · {incident.createdBy.email}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="incident-timeline">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Timeline</h2>
                <p className="text-sm text-muted-foreground">
                  Historial cronológico de cambios, asignaciones y comentarios.
                </p>
              </div>
            </div>

            {visibleTimeline.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Aún no hay eventos registrados en la traza.
              </div>
            ) : (
              <div className="space-y-4">
                {visibleTimeline.map((entry) => (
                  <div
                    key={`${entry.kind}-${entry.id}`}
                    className="rounded-lg border p-4"
                    data-testid={entry.kind === 'COMMENT' ? 'incident-timeline-comment' : 'incident-timeline-audit'}
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm font-medium">
                        {describeTimelineEntry(entry)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(entry.occurredAt)}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {entry.actor?.name || 'Sistema'}
                      {entry.actor?.email ? ` · ${entry.actor.email}` : ''}
                    </div>

                    {entry.kind === 'COMMENT' ? (
                      <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
                        <div className="mb-2 text-xs font-medium text-muted-foreground">
                          Visibilidad: {entry.visibility}
                        </div>
                        <p className="whitespace-pre-wrap">{entry.body}</p>
                      </div>
                    ) : entry.meta ? (
                      <pre className="mt-3 overflow-x-auto rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                        {JSON.stringify(entry.meta, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {canManage ? (
            <IncidentDetailActions
              incident={{
                id: incident.id,
                title: incident.title,
                description: incident.description ?? '',
                priority: incident.priority,
                status: incident.status,
                dueAt: incident.dueAt ? incident.dueAt.toISOString().slice(0, 10) : '',
                assignedProviderId: incident.assignedProviderId ?? '',
              }}
              providerOptions={providerOptions}
            />
          ) : (
            <section className="rounded-lg border bg-card text-card-foreground p-6 text-sm text-muted-foreground shadow-sm">
              Tu rol tiene acceso de lectura sobre esta incidencia, pero no puede
              modificarla.
            </section>
          )}
        </div>
      </section>
    </div>
  )
}
