import Link from 'next/link'
import {
  DollarSign,
  Receipt,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Calendar,
  FileText,
  ArrowUpRight,
} from 'lucide-react'
import { Suspense } from 'react'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/formatters'
import { computeOfficeFinanceKPIs } from '@/modules/finances/server/kpi-service'
import { getIncidentDashboardSnapshotQuery } from '@/modules/incidents/server/queries'

import { KPICard } from '@/components/ui/kpi-card'
import { PriorityBadge, StatusBadge } from '@/components/ui/badge'
import { DashboardCharts } from './_components/dashboard-charts'

export const dynamic = 'force-dynamic'

async function getGeneralStats(officeId: string) {
  const [communitiesCount, ownersCount, pendingReceipts, upcomingMeetings] =
    await Promise.all([
      prisma.community.count({
        where: { officeId, archivedAt: null },
      }),
      prisma.owner.count({
        where: { officeId, archivedAt: null },
      }),
      prisma.receipt.count({
        where: {
          community: { officeId },
          status: { in: ['ISSUED', 'OVERDUE'] },
        },
      }),
      prisma.meeting.count({
        where: {
          community: { officeId },
          scheduledAt: { gte: new Date() },
          status: { in: ['DRAFT', 'SCHEDULED'] },
        },
      }),
    ])

  return { communitiesCount, ownersCount, pendingReceipts, upcomingMeetings }
}

async function getReceiptStatusBreakdown(officeId: string) {
  const receipts = await prisma.receipt.groupBy({
    by: ['status'],
    where: { community: { officeId } },
    _count: { id: true },
  })
  return receipts.map((r) => ({ status: r.status, count: r._count.id }))
}

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

export default async function DashboardPage() {
  const session = await requireAuth()

  const financeKPIs = await computeOfficeFinanceKPIs(session.officeId)

  const receiptBreakdown = await getReceiptStatusBreakdown(session.officeId)
  const totalReceipts = receiptBreakdown.reduce((acc, d) => acc + d.count, 0)
  const paidCount = receiptBreakdown.find((r) => r.status === 'PAID')?.count ?? 0
  const paidPct = totalReceipts > 0 ? Math.round((paidCount / totalReceipts) * 100) : 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-sm text-muted-foreground">
            Resumen operativo de la cartera inmobiliaria al día de hoy.
          </p>
        </div>
        <Link
          href="/finance/receipts"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Receipt className="h-4 w-4" />
          Nueva factura
        </Link>
      </header>

      {/* Financial KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Total emitido"
          value={formatCurrency(financeKPIs.totalEmitido)}
          icon={<DollarSign className="h-5 w-5" />}
          accent="default"
        />
        <KPICard
          label="Total cobrado"
          value={formatCurrency(financeKPIs.totalCobrado)}
          icon={<Receipt className="h-5 w-5" />}
          accent="success"
          trend="up"
          trendLabel={`${paidPct}% cobrado`}
        />
        <KPICard
          label="Deuda pendiente"
          value={formatCurrency(financeKPIs.totalPendiente)}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="warning"
        />
        <KPICard
          label="Recibos vencidos"
          value={String(financeKPIs.overdueCount)}
          icon={<Clock className="h-5 w-5" />}
          accent={financeKPIs.overdueCount > 0 ? 'danger' : 'default'}
        />
      </section>

      {/* Main content: incidents + charts */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Active incidents table — streamed */}
        <Suspense fallback={
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden animate-pulse">
            <div className="border-b border-border/50 px-5 py-4"><div className="h-5 w-36 rounded-md bg-muted" /></div>
            <div className="divide-y divide-border/20">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-6 w-16 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5"><div className="h-4 w-44 rounded-md bg-muted" /><div className="h-3 w-28 rounded-md bg-muted/60" /></div>
                  <div className="h-6 w-20 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        }>
          <IncidentsSection />
        </Suspense>

        {/* Right: Charts + stats — streamed */}
        <Suspense fallback={
          <div className="space-y-6 animate-pulse">
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
              <div className="h-5 w-36 rounded-md bg-muted mb-4" />
              <div className="mx-auto h-32 w-32 rounded-full bg-muted/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center">
                  <div className="mx-auto h-5 w-5 rounded bg-muted/40 mb-2" />
                  <div className="mx-auto h-6 w-12 rounded-md bg-muted mb-1" />
                  <div className="mx-auto h-3 w-20 rounded-md bg-muted/60" />
                </div>
              ))}
            </div>
          </div>
        }>
          <ChartsSection officeId={session.officeId} paidPct={paidPct} receiptBreakdown={receiptBreakdown} />
        </Suspense>
      </div>
    </div>
  )
}

/* ─── Streamed: Incidents Table ──────────────────────────────── */

async function IncidentsSection() {
  const incidentSnapshot = await getIncidentDashboardSnapshotQuery()

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h2 className="text-base font-semibold">Incidencias activas</h2>
        <Link
          href="/incidents"
          className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-4"
        >
          Ver todas <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {incidentSnapshot.latestActive.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No hay incidencias activas en este momento.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Prioridad</th>
                <th className="px-5 py-3 font-medium">Incidencia</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {incidentSnapshot.latestActive.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-border/20 transition-colors hover:bg-muted/10"
                >
                  <td className="px-5 py-3">
                    <PriorityBadge priority={incident.priority} />
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {incident.title}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {incident.community.name}
                      {incident.unit ? ` · ${incident.unit.reference}` : ''}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                    {timeAgo(incident.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Streamed: Charts + Stats ───────────────────────────────── */

async function ChartsSection({
  officeId,
  paidPct,
  receiptBreakdown,
}: {
  officeId: string
  paidPct: number
  receiptBreakdown: { status: string; count: number }[]
}) {
  const stats = await getGeneralStats(officeId)

  const chartData = receiptBreakdown.map((r) => ({
    name: r.status === 'PAID' ? 'Pagados' : r.status === 'ISSUED' ? 'Emitidos' : r.status === 'PARTIALLY_PAID' ? 'Parciales' : r.status === 'OVERDUE' ? 'Vencidos' : r.status === 'DRAFT' ? 'Borrador' : r.status,
    value: r.count,
    color: r.status === 'PAID' ? '#22c55e' : r.status === 'ISSUED' ? '#3b82f6' : r.status === 'PARTIALLY_PAID' ? '#f59e0b' : r.status === 'OVERDUE' ? '#ef4444' : '#64748b',
  }))

  return (
    <div className="space-y-6">
      {/* Receipt donut chart */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 shadow-sm">
        <h3 className="text-base font-semibold mb-3">Estado de Recibos</h3>
        {chartData.length > 0 ? (
          <DashboardCharts donutData={chartData} paidPct={paidPct} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sin datos de recibos.
          </p>
        )}
      </div>

      {/* Activity summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center">
          <Building2 className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold">{stats.communitiesCount}</p>
          <p className="text-xs text-muted-foreground">Comunidades</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold">{stats.ownersCount}</p>
          <p className="text-xs text-muted-foreground">Propietarios</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center">
          <FileText className="h-5 w-5 mx-auto text-amber-400 mb-1" />
          <p className="text-xl font-bold">{stats.pendingReceipts}</p>
          <p className="text-xs text-muted-foreground">Rec. pendientes</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center">
          <Calendar className="h-5 w-5 mx-auto text-green-400 mb-1" />
          <p className="text-xl font-bold">{stats.upcomingMeetings}</p>
          <p className="text-xs text-muted-foreground">Reuniones prox.</p>
        </div>
      </div>
    </div>
  )
}
