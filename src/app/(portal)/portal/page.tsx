import Link from 'next/link'
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Home,
  Loader2,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

import {
  PortalBadge,
  PortalEmptyState,
  getIncidentStatusTone,
  getReceiptStatusTone,
  INCIDENT_STATUS_LABELS,
  RECEIPT_STATUS_LABELS,
} from '@/modules/portal/components/ui'
import { KPICard } from '@/components/ui/kpi-card'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getPortalDashboardPageQuery } from '@/modules/portal/server/queries'

export default async function PortalDashboardPage() {
  const { type, portalDashboard, providerDashboard, session } = await getPortalDashboardPageQuery()

  if (type === 'PROVIDER') {
    const dashboard = providerDashboard!

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hola, {session.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Panel de incidencias asignadas a tu cuenta de proveedor. Solo se muestran las incidencias donde estás asignado y los comentarios compartidos.</p>
          </div>
          <Link
            href="/portal/incidents"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ver todas las incidencias
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            label="Asignadas activas"
            value={dashboard.kpis.totalAssigned}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="warning"
          />
          <KPICard
            label="En curso"
            value={dashboard.kpis.inProgressCount}
            icon={<Loader2 className="h-5 w-5" />}
            accent="default"
          />
          <KPICard
            label="Resueltas / Cerradas"
            value={dashboard.kpis.resolvedCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="success"
          />
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Incidencias recientes</h2>
            <p className="text-sm text-muted-foreground">
              Últimas incidencias asignadas, ordenadas por actividad reciente.
            </p>
          </div>

          {dashboard.recentIncidents.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentIncidents.map((incident) => (
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
                    <PortalBadge tone={getIncidentStatusTone(incident.status)}>
                      {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                    </PortalBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Reportada: {formatDate(incident.reportedAt)}</span>
                    {incident.dueAt && <span>Vencimiento: {formatDate(incident.dueAt)}</span>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Sin incidencias asignadas"
              description="Cuando el despacho te asigne incidencias, aparecerán aquí con su estado y contexto."
            />
          )}
        </section>
      </div>
    )
  }

  const dashboard = portalDashboard!

  if (!dashboard.scope || (!dashboard.scope.ownedCommunityIds.length && !dashboard.scope.presidentCommunityIds.length)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tu portal está listo, pero sin comunidades activas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Cuando exista una vinculación activa con unidades o un cargo vigente de presidencia, aquí aparecerán tus recibos, incidencias y el resumen de comunidad dentro de tu alcance.</p>
          </div>
        </div>

        <PortalEmptyState
          title="Aún no hay datos visibles para esta cuenta"
          description="Revisa la vinculación del usuario con un propietario y las relaciones activas de ownership o junta para habilitar el portal con datos reales."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hola, {session.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Este resumen combina tus comunidades, unidades, deuda pendiente, recibos recientes e incidencias activas dentro de tu alcance autorizado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/receipts"
            className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Ver recibos
          </Link>
          <Link
            href="/portal/incidents"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Gestionar incidencias
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Comunidades"
          value={dashboard.kpis?.ownedCommunitiesCount ?? 0}
          icon={<Building2 className="h-5 w-5" />}
        />
        <KPICard
          label="Unidades"
          value={dashboard.kpis?.ownedUnitsCount ?? 0}
          icon={<Home className="h-5 w-5" />}
        />
        <KPICard
          label="Deuda pendiente"
          value={formatCurrency(dashboard.kpis?.ownerPendingDebtTotal ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
          accent={(dashboard.kpis?.ownerPendingDebtTotal ?? 0) > 0 ? "danger" : "default"}
        />
        <KPICard
          label="Incidencias activas"
          value={dashboard.kpis?.ownerActiveIncidentCount ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={(dashboard.kpis?.ownerActiveIncidentCount ?? 0) > 0 ? "warning" : "default"}
        />
      </div>

      {session.role === 'PRESIDENT' && dashboard.kpis && dashboard.kpis.presidentCommunitiesCount > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Capa de presidencia</h2>
            <p className="text-sm text-muted-foreground">
              Resumen agregado de las comunidades donde tienes un cargo activo de presidencia.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <KPICard
              label="Comunidades con cargo activo"
              value={dashboard.kpis.presidentCommunitiesCount}
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <KPICard
              label="Incidencias comunitarias abiertas"
              value={dashboard.kpis.presidentOpenIncidentCount}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent={dashboard.kpis.presidentOpenIncidentCount > 0 ? "warning" : "default"}
            />
            <KPICard
              label="Deuda comunitaria agregada"
              value={formatCurrency(dashboard.kpis.presidentPendingDebtTotal)}
              icon={<Wallet className="h-5 w-5" />}
              accent={dashboard.kpis.presidentPendingDebtTotal > 0 ? "danger" : "default"}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tus comunidades</h2>
          <p className="text-sm text-muted-foreground">
            Resumen simple por comunidad con tus unidades, deuda propia, incidencias de tus unidades y próxima reunión visible.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {dashboard.ownedCommunitySummaries.map((community) => (
            <article key={community.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{community.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {community.ownedUnitCount} {community.ownedUnitCount === 1 ? 'unidad' : 'unidades'} vinculadas
                  </p>
                </div>
                <PortalBadge tone="info">En alcance</PortalBadge>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Deuda propia</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatCurrency(community.pendingDebtTotal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Incidencias activas</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{community.activeIncidentCount}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Próxima reunión</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {community.nextMeetingAt ? formatDate(community.nextMeetingAt) : 'Sin fecha visible'}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Últimos recibos emitidos</h2>
              <p className="text-sm text-muted-foreground">
                Solo se muestran tus recibos autorizados.
              </p>
            </div>
            <Link href="/portal/receipts" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>

          {dashboard.latestReceipts.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Comunidad</th>
                      <th className="px-4 py-3 font-medium">Unidad</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Importe</th>
                      <th className="px-4 py-3 font-medium">Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {dashboard.latestReceipts.map((receipt) => (
                      <tr key={receipt.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{receipt.community.name}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(receipt.issueDate)}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{receipt.unit.reference}</td>
                        <td className="px-4 py-3">
                          <PortalBadge tone={getReceiptStatusTone(receipt.status)}>
                            {RECEIPT_STATUS_LABELS[receipt.status] ?? receipt.status}
                          </PortalBadge>
                        </td>
                        <td className="px-4 py-3 text-foreground">{formatCurrency(receipt.amountValue)}</td>
                        <td className="px-4 py-3 text-foreground">{formatCurrency(receipt.pendingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <PortalEmptyState
              title="Sin recibos visibles"
              description="Cuando existan recibos emitidos para tus unidades, aparecerán aquí con su estado y saldo pendiente."
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Próximas reuniones</h2>
              <p className="text-sm text-muted-foreground">
                Solo eventos visibles en tus comunidades dentro de alcance.
              </p>
            </div>
            <Link href="/portal/meetings" className="text-sm font-medium text-primary hover:underline">
              Ver agenda
            </Link>
          </div>

          {dashboard.upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {dashboard.upcomingMeetings.map((meeting) => (
                <article key={meeting.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{meeting.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{meeting.community.name}</p>
                    </div>
                    <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm text-foreground">{formatDate(meeting.scheduledAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{meeting.location || 'Ubicación pendiente de confirmar'}</p>
                </article>
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Sin reuniones próximas visibles"
              description="Cuando haya convocatorias publicadas para tus comunidades, aparecerán aquí con su fecha y lugar."
            />
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Incidencias activas de tus unidades</h2>
            <p className="text-sm text-muted-foreground">
              Comentarios internos y trazas operativas del backoffice quedan fuera del portal.
            </p>
          </div>
          <Link href="/portal/incidents" className="text-sm font-medium text-primary hover:underline">
            Ver incidencias
          </Link>
        </div>

        {dashboard.ownedActiveIncidents.length > 0 ? (
          <div className="space-y-3">
            {dashboard.ownedActiveIncidents.map((incident) => (
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
                  <PortalBadge tone={getIncidentStatusTone(incident.status)}>
                    {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                  </PortalBadge>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Reportada: {formatDate(incident.reportedAt)}</span>
                  <span>Proveedor: {incident.assignedProvider?.name ?? 'Sin asignar'}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PortalEmptyState
            title="Sin incidencias activas en tus unidades"
            description="Cuando exista alguna incidencia abierta o en curso vinculada a tus unidades, aparecerá aquí."
          />
        )}
      </section>

      {session.role === 'PRESIDENT' && dashboard.presidentCommunitySummaries.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Resumen agregado de presidencia</h2>
            <p className="text-sm text-muted-foreground">
              Capa adicional para seguimiento de comunidad sin exponer recibos individuales ajenos ni comentarios internos.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {dashboard.presidentCommunitySummaries.map((community) => (
              <article key={community.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{community.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Cargo activo de presidencia</p>
                  </div>
                  <PortalBadge tone="info">Agregado</PortalBadge>
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Abiertas</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{community.openIncidentCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Urgentes</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{community.urgentIncidentCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Deuda agregada</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {formatCurrency(community.pendingDebtTotal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Docs visibles</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{community.visibleDocumentCount}</dd>
                  </div>
                </dl>

                <p className="mt-4 text-xs text-muted-foreground">
                  Próxima reunión: {community.nextMeetingAt ? formatDate(community.nextMeetingAt) : 'sin fecha publicada'}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
