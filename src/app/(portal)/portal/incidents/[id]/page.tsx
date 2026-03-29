import { notFound } from 'next/navigation'
import {
  BackLink,
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_STATUS_LABELS,
  PortalAlert,
  PortalBadge,
  getIncidentPriorityTone,
  getIncidentStatusTone,
} from '@/modules/portal/components/ui'
import { requireAuth } from '@/lib/auth'
import { formatDate, formatDateTime } from '@/lib/formatters'
import {
  addPortalIncidentCommentAction,
  addProviderCommentAction,
  changeProviderStatusAction,
} from '@/modules/portal/server/actions'
import { getPortalIncidentDetail } from '@/modules/portal/server/incidents'
import { getProviderIncidentDetail } from '@/modules/portal/server/provider'

interface PortalIncidentDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PortalIncidentDetailPage({
  params,
  searchParams,
}: PortalIncidentDetailPageProps) {
  const session = await requireAuth()
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams])

  const error = getSingleParam(rawSearchParams.error)
  const created = getSingleParam(rawSearchParams.created)
  const commented = getSingleParam(rawSearchParams.commented)
  const statusChanged = getSingleParam(rawSearchParams.status_changed)

  // ─── Provider Detail ───────────────────────────────────
  if (session.role === 'PROVIDER') {
    const incident = await getProviderIncidentDetail(session, id)
    if (!incident) notFound()

    return (
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Detalle de incidencia (Proveedor)</h1>
              <p className="mt-1 text-sm text-muted-foreground">{incident.title}</p>
            </div>
            <BackLink href="/portal/incidents">Volver a incidencias</BackLink>
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

        {statusChanged ? (
          <PortalAlert variant="success">El estado de la incidencia se ha actualizado correctamente.</PortalAlert>
        ) : null}
        {commented ? (
          <PortalAlert variant="success">Tu comentario compartido ya está visible.</PortalAlert>
        ) : null}
        {error ? <PortalAlert variant="error">{error}</PortalAlert> : null}
        <PortalAlert>
          Solo ves comentarios <strong>SHARED</strong>. Los comentarios internos del despacho no se muestran.
        </PortalAlert>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          {/* Context & Status */}
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Estado y contexto</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Comunidad</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{incident.community.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Dirección</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{incident.community.address || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Unidad</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {incident.unit ? `${incident.unit.reference} · Planta ${incident.unit.floor}${incident.unit.door ? `, Puerta ${incident.unit.door}` : ''}` : 'Incidencia comunitaria'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Prioridad</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {INCIDENT_PRIORITY_LABELS[incident.priority] ?? incident.priority}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Reportada</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{formatDateTime(incident.reportedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Fecha objetivo</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(incident.dueAt)}</dd>
              </div>
            </dl>

            {incident.description ? (
              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6 text-foreground">
                {incident.description}
              </div>
            ) : null}

            {/* Status Change */}
            {incident.allowedTransitions.length > 0 ? (
              <div className="mt-6 space-y-3 border-t border-border pt-5">
                <h3 className="text-sm font-semibold text-foreground">Cambiar estado</h3>
                <p className="text-xs text-muted-foreground">
                  Como proveedor, puedes mover esta incidencia a los estados permitidos.
                </p>
                <div className="flex flex-wrap gap-2">
                  {incident.allowedTransitions.map((status) => (
                    <form key={status} action={changeProviderStatusAction}>
                      <input type="hidden" name="incidentId" value={incident.id} />
                      <input type="hidden" name="status" value={status} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        → {INCIDENT_STATUS_LABELS[status] ?? status}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ) : null}
          </article>

          {/* Comment Form */}
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Añadir comentario compartido</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu comentario será visible para el despacho y el propietario afectado.
            </p>

            <form action={addProviderCommentAction} className="mt-5 space-y-4">
              <input type="hidden" name="incidentId" value={incident.id} />
              <div className="space-y-2">
                <label htmlFor="providerBody" className="text-sm font-medium text-foreground">
                  Comentario
                </label>
                <textarea
                  id="providerBody"
                  name="body"
                  rows={5}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Escribe una actualización sobre el trabajo realizado"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Publicar comentario
              </button>
            </form>
          </article>
        </section>

        {/* Comments Thread */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Conversación compartida</h2>
            <p className="text-sm text-muted-foreground">
              Solo comentarios con visibilidad SHARED. Los comentarios internos del despacho nunca se exponen aquí.
            </p>
          </div>

          {incident.comments.length > 0 ? (
            <div className="space-y-3">
              {incident.comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{comment.author.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
                    </div>
                    <PortalBadge tone="info">Compartido</PortalBadge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-foreground">{comment.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              Aún no hay comentarios compartidos visibles para esta incidencia.
            </div>
          )}
        </section>
      </div>
    )
  }

  // ─── Owner / President Detail ──────────────────────────
  const incident = await getPortalIncidentDetail(session, id)
  if (!incident) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detalle de incidencia</h1>
          <p className="mt-1 text-sm text-muted-foreground">{incident.title}</p>
        </div>
        <BackLink href="/portal/incidents">Volver a mis incidencias</BackLink>
      </div>
      <div className="flex flex-wrap gap-2">
        <PortalBadge tone={getIncidentPriorityTone(incident.priority)}>
          {INCIDENT_PRIORITY_LABELS[incident.priority] ?? incident.priority}
        </PortalBadge>
        <PortalBadge tone={getIncidentStatusTone(incident.status)}>
          {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
        </PortalBadge>
      </div>

      {created ? (
        <PortalAlert variant="success">La incidencia se ha creado correctamente en el portal.</PortalAlert>
      ) : null}
      {commented ? (
        <PortalAlert variant="success">Tu comentario compartido ya está visible en el portal.</PortalAlert>
      ) : null}
      {error ? <PortalAlert variant="error">{error}</PortalAlert> : null}
      <PortalAlert>
        En portal solo se muestran comentarios <strong>SHARED</strong>. Los comentarios internos del backoffice nunca se exponen aquí.
      </PortalAlert>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Estado y contexto</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Comunidad</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{incident.community.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Unidad</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {incident.unit?.reference ?? 'Incidencia comunitaria'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Estado</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Prioridad</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {INCIDENT_PRIORITY_LABELS[incident.priority] ?? incident.priority}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Reportada</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{formatDateTime(incident.reportedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Fecha objetivo</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(incident.dueAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Resuelta</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{formatDateTime(incident.resolvedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Proveedor</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {incident.assignedProvider?.name ?? 'Sin asignar'}
              </dd>
            </div>
          </dl>

          {incident.description ? (
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6 text-foreground">
              {incident.description}
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Añadir comentario compartido</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Este comentario será visible en el portal según la política de visibilidad compartida.
          </p>

          <form action={addPortalIncidentCommentAction} className="mt-5 space-y-4">
            <input type="hidden" name="incidentId" value={incident.id} />
            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium text-foreground">
                Comentario
              </label>
              <textarea
                id="body"
                name="body"
                rows={5}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Escribe una actualización, observación o respuesta visible en portal"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Publicar comentario compartido
            </button>
          </form>
        </article>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Conversación visible en portal</h2>
          <p className="text-sm text-muted-foreground">
            Solo comentarios compartidos por backoffice, presidencia, propietario o proveedor cuando la visibilidad sea SHARED.
          </p>
        </div>

        {incident.comments.length > 0 ? (
          <div className="space-y-3">
            {incident.comments.map((comment) => (
              <article key={comment.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
                  </div>
                  <PortalBadge tone="info">Compartido</PortalBadge>
                </div>
                <p className="mt-4 text-sm leading-6 text-foreground">{comment.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            Aún no hay comentarios compartidos visibles para esta incidencia.
          </div>
        )}
      </section>
    </div>
  )
}
