import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/formatters'
import {
  Building2,
  Users,
  AlertTriangle,
  Receipt,
  TrendingDown,
  Wallet,
  Calendar,
  FileText,
  Banknote,
  Euro
} from 'lucide-react'
import { computeOfficeFinanceKPIs } from '@/modules/finances/server/kpi-service'

export const dynamic = 'force-dynamic'

async function getStats(officeId: string) {
  const [
    communitiesCount,
    ownersCount,
    openIncidents,
    pendingReceipts,
    totalDebt,
    monthPayments,
    upcomingMeetings,
    recentDocuments,
  ] = await Promise.all([
    prisma.community.count({ where: { officeId, archivedAt: null } }),
    prisma.owner.count({ where: { officeId, archivedAt: null } }),
    prisma.incident.count({
      where: {
        community: { officeId },
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_VENDOR'] },
      },
    }),
    prisma.receipt.count({
      where: {
        community: { officeId },
        status: { in: ['ISSUED', 'OVERDUE'] },
      },
    }),
    prisma.debt.aggregate({
      where: {
        community: { officeId },
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      _sum: { principal: true, surcharge: true },
    }),
    prisma.payment.aggregate({
      where: {
        receipt: { community: { officeId } },
        paymentDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    prisma.meeting.count({
      where: {
        community: { officeId },
        scheduledAt: { gte: new Date() },
        status: { in: ['DRAFT', 'SCHEDULED'] },
      },
    }),
    prisma.document.count({
      where: {
        community: { officeId },
        archivedAt: null,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const debtSum = Number(totalDebt._sum.principal || 0) + Number(totalDebt._sum.surcharge || 0)
  const paymentsSum = Number(monthPayments._sum.amount || 0)

  return {
    communitiesCount,
    ownersCount,
    openIncidents,
    pendingReceipts,
    totalDebt: debtSum,
    monthPayments: paymentsSum,
    upcomingMeetings,
    recentDocuments,
  }
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const stats = await getStats(session.officeId)

  const kpis = [
    { label: 'Comunidades', value: stats.communitiesCount, icon: Building2, color: 'text-blue-500' },
    { label: 'Propietarios', value: stats.ownersCount, icon: Users, color: 'text-emerald-500' },
    { label: 'Incidencias abiertas', value: stats.openIncidents, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Recibos pendientes', value: stats.pendingReceipts, icon: Receipt, color: 'text-orange-500' },
    { label: 'Deuda acumulada', value: formatCurrency(stats.totalDebt), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Recibos (Mes)', value: formatCurrency(stats.monthPayments), icon: Wallet, color: 'text-green-500' },
    { label: 'Reuniones próximas', value: stats.upcomingMeetings, icon: Calendar, color: 'text-purple-500' },
    { label: 'Documentos recientes', value: stats.recentDocuments, icon: FileText, color: 'text-indigo-500' },
  ]

  const financeKPIs = await computeOfficeFinanceKPIs(session.officeId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general del despacho
        </p>
      </div>

      {/* Primary Financial KPIs */}
      <h2 className="text-lg font-semibold text-foreground mt-8 border-b pb-2">Estado Financiero Global</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Emitido</p>
            <Banknote className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(financeKPIs.totalEmitido)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Cobrado</p>
            <Wallet className="h-5 w-5 text-success" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(financeKPIs.totalCobrado)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Deuda Pendiente</p>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(financeKPIs.totalPendiente)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Recibos Vencidos</p>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{financeKPIs.overdueCount}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-foreground mt-8 border-b pb-2">Actividad General</h2>
      {/* Activity KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Access */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Accesos rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nueva comunidad', href: '/communities' },
              { label: 'Nuevo propietario', href: '/owners' },
              { label: 'Emitir recibos', href: '/finance/receipts' },
              { label: 'Nueva incidencia', href: '/incidents' },
              { label: 'Nueva reunión', href: '/meetings' },
              { label: 'Subir documento', href: '/documents' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors text-center"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Actividad reciente</h3>
          <div className="text-sm text-muted-foreground">
            <p className="py-8 text-center">Las últimas acciones aparecerán aquí</p>
          </div>
        </div>
      </div>
    </div>
  )
}
