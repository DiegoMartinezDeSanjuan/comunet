import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  DollarSign,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  Download,
} from 'lucide-react'
import { Suspense } from 'react'

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

import { KPICard } from '@/components/ui/kpi-card'
import { PriorityBadge, ReceiptStatusBadge } from '@/components/ui/badge'
import { ReportsCharts } from './reports-charts'

export const dynamic = 'force-dynamic'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} días`
}

export default async function ReportsPage() {
  const session = await requireAuth()

  if (!canReadReports(session)) {
    redirect('/dashboard')
  }

  // KPIs are fast — fetch before render
  const kpis = await getReportsDashboard(session.officeId)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">COMUNET Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Resumen detallado del estado financiero y operativo de tus comunidades.
          </p>
        </div>
        <Link
          href="/api/reports/export"
          className="inline-flex items-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Download className="h-4 w-4" />
          Exportar datos
        </Link>
      </header>

      {/* KPIs — rendered immediately */}
      <section className="grid gap-4 md:grid-cols-3">
        <KPICard
          label="Deuda Total Pendiente"
          value={formatCurrency(kpis.totalPendingDebt)}
          icon={<DollarSign className="h-5 w-5" />}
          accent="danger"
          trend="down"
          trendLabel="Cobros pendientes"
        />
        <KPICard
          label="Incidencias Abiertas"
          value={kpis.openIncidents}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={kpis.openIncidents > 5 ? 'warning' : 'default'}
        />
        <KPICard
          label="Comunidades Activas"
          value={kpis.communitiesCount}
          icon={<Building2 className="h-5 w-5" />}
          accent="success"
        />
      </section>

      {/* Charts Row — streamed */}
      <Suspense fallback={
        <div className="grid gap-6 lg:grid-cols-2 animate-pulse">
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 h-64">
            <div className="h-5 w-40 rounded-md bg-muted mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 rounded bg-muted" style={{ width: `${80 - i * 15}%` }} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 h-64">
            <div className="h-5 w-44 rounded-md bg-muted mb-4" />
            <div className="mx-auto h-36 w-36 rounded-full bg-muted/30" />
          </div>
        </div>
      }>
        <ChartsSection officeId={session.officeId} />
      </Suspense>

      {/* Receipt Status + Bottom sections — streamed */}
      <Suspense fallback={
        <div className="space-y-6 animate-pulse">
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 h-24">
            <div className="h-5 w-36 rounded-md bg-muted mb-3" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 h-16 rounded-xl bg-muted/30" />
              ))}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 h-48" />
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 h-48" />
          </div>
        </div>
      }>
        <DataTablesSection officeId={session.officeId} />
      </Suspense>
    </div>
  )
}

/* ─── Streamed: Charts ──────────────────────────────── */

async function ChartsSection({ officeId }: { officeId: string }) {
  const [debtByCommunity, incidentsSummary] = await Promise.all([
    getDebtByCommunityReport(officeId),
    getIncidentsSummaryReport(officeId),
  ])

  const maxDebt = Math.max(...debtByCommunity.map((c) => c.totalDebt), 1)
  const debtBarData = debtByCommunity.map((c) => ({
    name: c.communityName,
    value: c.totalDebt,
    color: c.totalDebt > maxDebt * 0.7 ? '#ef4444' : c.totalDebt > maxDebt * 0.4 ? '#f59e0b' : '#3b82f6',
  }))

  const priorityDonutData = [
    { name: 'Urgente', value: incidentsSummary.activeByPriority.find((p) => p.priority === 'URGENT')?.count || 0, color: '#ef4444' },
    { name: 'Alta',    value: incidentsSummary.activeByPriority.find((p) => p.priority === 'HIGH')?.count || 0,   color: '#f97316' },
    { name: 'Media',   value: incidentsSummary.activeByPriority.find((p) => p.priority === 'MEDIUM')?.count || 0, color: '#3b82f6' },
    { name: 'Baja',    value: incidentsSummary.activeByPriority.find((p) => p.priority === 'LOW')?.count || 0,    color: '#64748b' },
  ]

  const totalIncidents = priorityDonutData.reduce((acc, d) => acc + d.value, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Debt bar chart */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Deuda por Comunidad</h2>
          <Link href="/finance/receipts" className="text-sm text-primary hover:underline">
            Ver detalles
          </Link>
        </div>
        <div className="p-5">
          {debtBarData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay deuda registrada.</p>
          ) : (
            <ReportsCharts type="hbar" hbarData={debtBarData} formatType="currency" />
          )}
        </div>
      </div>

      {/* Priority donut chart */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Incidencias por Prioridad</h2>
        </div>
        <div className="p-5">
          <ReportsCharts
            type="donut"
            donutData={priorityDonutData}
            centerValue={totalIncidents}
            centerLabel="total"
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Streamed: Data Tables ─────────────────────────── */

async function DataTablesSection({ officeId }: { officeId: string }) {
  const [receiptsStatus, incidentsSummary, upcomingMeetings, providerPerformance] = await Promise.all([
    getReceiptsStatusReport(officeId),
    getIncidentsSummaryReport(officeId),
    getUpcomingMeetingsReport(officeId),
    getProviderPerformanceSummary(officeId),
  ])

  return (
    <>
      {/* Receipt Status Row */}
      <section className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Estado de Recibos</h2>
        </div>
        <div className="p-5">
          {receiptsStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay recibos generados.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {receiptsStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-5 py-3 min-w-[180px] flex-1"
                >
                  <div>
                    <ReceiptStatusBadge status={s.status} />
                    <p className="text-lg font-bold mt-1 tabular-nums">{formatCurrency(s.amount)}</p>
                    <p className="text-xs text-muted-foreground">{s.count} recibos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent incidents */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <h2 className="text-base font-semibold">Incidencias Recientes</h2>
            <Link href="/incidents" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {incidentsSummary.recentActive.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No hay incidencias activas.</div>
          ) : (
            <div className="divide-y divide-border/20">
              {incidentsSummary.recentActive.map((inc) => (
                <div key={inc.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/incidents/${inc.id}`} className="text-sm font-medium hover:underline truncate block">
                      {inc.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {inc.communityName} · {timeAgo(inc.createdAt)}
                    </p>
                  </div>
                  <PriorityBadge priority={inc.priority} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming meetings */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <h2 className="text-base font-semibold">Próximas Reuniones</h2>
            <Link href="/meetings" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No hay reuniones programadas.</div>
          ) : (
            <div className="divide-y divide-border/20">
              {upcomingMeetings.map((meeting) => {
                const d = new Date(meeting.scheduledAt)
                const day = d.getDate()
                const month = d.toLocaleDateString('es-ES', { month: 'short' })
                return (
                  <div key={meeting.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/10">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 w-12 h-12 shrink-0">
                      <span className="text-xs uppercase text-primary font-semibold">{month}</span>
                      <span className="text-lg font-bold text-primary leading-none">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/meetings/${meeting.id}`} className="text-sm font-medium hover:underline truncate block">
                        {meeting.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{meeting.communityName}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Provider workload */}
      {providerPerformance.length > 0 ? (
        <section className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="border-b border-border/50 px-5 py-4">
            <h2 className="text-base font-semibold">Carga de Proveedores</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 text-right font-medium">Inc. Activas</th>
                </tr>
              </thead>
              <tbody>
                {providerPerformance.map((prov) => (
                  <tr key={prov.providerId} className="border-b border-border/20 transition-colors hover:bg-muted/10">
                    <td className="px-5 py-3">
                      <div className="font-medium">{prov.name}</div>
                      <div className="text-xs text-muted-foreground">{prov.category || ''}</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs h-6 w-6">
                        {prov.activeIncidents}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  )
}
