import { redirect } from 'next/navigation'
import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { canReadReports } from '@/lib/permissions'
import { formatCurrency } from '@/lib/formatters'
import {
  getDebtByCommunityReport,
  getIncidentsSummaryReport,
  getReportsDashboard,
  getUpcomingMeetingsReport,
  getReceiptsStatusReport,
  getProviderPerformanceSummary,
} from '@/modules/reports/server/queries'

export const dynamic = 'force-dynamic'

function formatDate(value: Date | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-ES')
}

export default async function ReportsPage() {
  const session = await requireAuth()

  if (!canReadReports(session)) {
    redirect('/dashboard')
  }

  const [
    kpis,
    debtByCommunity,
    receiptsStatus,
    incidentsSummary,
    upcomingMeetings,
    providerPerformance,
  ] = await Promise.all([
    getReportsDashboard(session.officeId),
    getDebtByCommunityReport(session.officeId),
    getReceiptsStatusReport(session.officeId),
    getIncidentsSummaryReport(session.officeId),
    getUpcomingMeetingsReport(session.officeId),
    getProviderPerformanceSummary(session.officeId),
  ])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores clave, deuda por comunidad, recibos y estatus general operativo.
        </p>
      </header>

      {/* KPIs Section */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Deuda Total Pendiente</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {formatCurrency(kpis.totalPendingDebt)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Incidencias Abiertas</div>
          <div className="mt-2 text-3xl font-bold">
            {kpis.openIncidents}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Comunidades Activas</div>
          <div className="mt-2 text-3xl font-bold">
            {kpis.communitiesCount}
          </div>
        </div>
      </section>

      {/* Main Grid: left column (debt & receipts) / right column (incidents & meetings) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 border-b">
              <h2 className="text-lg font-semibold">Deuda por Comunidad</h2>
            </div>
            {debtByCommunity.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No hay deuda registrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Comunidad</th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground">Deudores</th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground">Deuda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtByCommunity.map((comm) => (
                      <tr key={comm.communityId} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4">{comm.communityName}</td>
                        <td className="p-4 text-right">{comm.debtorsCount}</td>
                        <td className="p-4 text-right font-medium text-red-600">
                          {formatCurrency(comm.totalDebt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 border-b">
              <h2 className="text-lg font-semibold">Estado de Recibos</h2>
            </div>
            <div className="p-4 grid gap-4 grid-cols-2 sm:grid-cols-3">
              {receiptsStatus.length === 0 ? (
                <div className="col-span-full text-sm text-muted-foreground text-center py-4">No hay recibos generados.</div>
              ) : (
                receiptsStatus.map((status) => (
                  <div key={status.status} className="rounded-md border p-3 bg-muted/10">
                    <div className="text-xs text-muted-foreground font-medium mb-1">{status.status}</div>
                    <div className="text-xl font-semibold">{status.count}</div>
                    <div className="text-xs text-muted-foreground mt-1">{formatCurrency(status.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
          
          <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 border-b">
              <h2 className="text-lg font-semibold">Carga de Proveedores</h2>
            </div>
            {providerPerformance.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No hay carga asignada actual.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Proveedor</th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground">Inc. Activas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerPerformance.map((prov) => (
                      <tr key={prov.providerId} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">{prov.name}</div>
                          <div className="text-xs text-muted-foreground">{prov.category || 'Sin categoría'}</div>
                        </td>
                        <td className="p-4 text-right font-medium">{prov.activeIncidents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 border-b">
              <h2 className="text-lg font-semibold">Incidencias por Prioridad</h2>
            </div>
            <div className="p-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
              {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priorityLabel) => {
                const priorityData = incidentsSummary.activeByPriority.find(p => p.priority === priorityLabel)
                return (
                  <div key={priorityLabel} className="rounded-md border p-3 flex flex-col items-center justify-center bg-muted/10">
                    <div className="text-xs text-muted-foreground font-medium mb-1">{priorityLabel}</div>
                    <div className="text-2xl font-semibold">{priorityData?.count || 0}</div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Incidencias Recientes</h2>
              <Link href="/incidents" className="text-sm text-primary hover:underline">Ver todas</Link>
            </div>
            {incidentsSummary.recentActive.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No hay incidencias activas.</div>
            ) : (
              <div className="divide-y">
                {incidentsSummary.recentActive.map((inc) => (
                  <div key={inc.id} className="p-4 flex flex-col gap-1 transition-colors hover:bg-muted/20">
                    <div className="flex justify-between">
                      <Link href={`/incidents/${inc.id}`} className="font-medium hover:underline flex-1 truncate pr-2">
                        {inc.title}
                      </Link>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-muted">{inc.priority}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{inc.communityName}</span>
                      <span>{formatDate(inc.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Próximas Reuniones</h2>
              <Link href="/meetings" className="text-sm text-primary hover:underline">Ver todas</Link>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No hay reuniones programadas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Fecha</th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Comunidad</th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Título</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingMeetings.map((meeting) => (
                      <tr key={meeting.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 whitespace-nowrap">{formatDate(meeting.scheduledAt)}</td>
                        <td className="p-4">{meeting.communityName}</td>
                        <td className="p-4">
                          <Link href={`/meetings/${meeting.id}`} className="hover:underline">
                            {meeting.title}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
