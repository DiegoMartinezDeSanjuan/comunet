import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/formatters'
import { computeOfficeFinanceKPIs } from '@/modules/finances/server/kpi-service'
import { getIncidentDashboardSnapshotQuery } from '@/modules/incidents/server/queries'

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

  return {
    communitiesCount,
    ownersCount,
    pendingReceipts,
    upcomingMeetings,
  }
}

function formatDate(value: Date | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-ES')
}

export default async function DashboardPage() {
  const session = await requireAuth()

  const [stats, financeKPIs, incidentSnapshot] = await Promise.all([
    getGeneralStats(session.officeId),
    computeOfficeFinanceKPIs(session.officeId),
    getIncidentDashboardSnapshotQuery(),
  ])

  const financialCards = [
    { label: 'Total emitido', value: formatCurrency(financeKPIs.totalEmitido) },
    { label: 'Total cobrado', value: formatCurrency(financeKPIs.totalCobrado) },
    { label: 'Deuda pendiente', value: formatCurrency(financeKPIs.totalPendiente) },
    { label: 'Recibos vencidos', value: String(financeKPIs.overdueCount) },
  ]

  const activityCards = [
    { label: 'Comunidades', value: String(stats.communitiesCount) },
    { label: 'Propietarios', value: String(stats.ownersCount) },
    { label: 'Recibos pendientes', value: String(stats.pendingReceipts) },
    { label: 'Reuniones proximas', value: String(stats.upcomingMeetings) },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen operativo del despacho con foco en finanzas e incidencias.
        </p>
      </header>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Estado financiero global</h2>
            <p className="text-sm text-muted-foreground">
              Indicadores basicos de emision, cobro y deuda.
            </p>
          </div>
          <Link
            href="/finance/receipts"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ir a recibos
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {financialCards.map((card) => (
            <div key={card.label} className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold">{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">KPIs de incidencias</h2>
            <p className="text-sm text-muted-foreground">
              Volumen abierto, urgencias, vencidas y carga por proveedor.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link
              href="/incidents"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver incidencias
            </Link>
            <Link
              href="/providers"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver proveedores
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Abiertas</div>
                <div className="mt-2 text-2xl font-semibold">
                  {incidentSnapshot.openCount}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Urgentes</div>
                <div className="mt-2 text-2xl font-semibold">
                  {incidentSnapshot.urgentCount}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Vencidas</div>
                <div className="mt-2 text-2xl font-semibold">
                  {incidentSnapshot.overdueCount}
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Incidencias por proveedor</h3>
              <div className="mt-3 space-y-3">
                {incidentSnapshot.incidentsByProvider.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavia no hay incidencias activas.
                  </p>
                ) : (
                  incidentSnapshot.incidentsByProvider.map((item) => (
                    <div key={item.providerId ?? 'unassigned'}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span>{item.providerName}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-medium">Ultimas incidencias activas</h3>
              <Link
                href="/notifications"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Ver notificaciones
              </Link>
            </div>

            {incidentSnapshot.latestActive.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No hay incidencias activas en este momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Incidencia</th>
                      <th className="px-3 py-2 font-medium">Comunidad</th>
                      <th className="px-3 py-2 font-medium">Proveedor</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Vence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidentSnapshot.latestActive.map((incident) => (
                      <tr key={incident.id} className="border-b align-top">
                        <td className="px-3 py-3">
                          <Link
                            href={`/incidents/${incident.id}`}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {incident.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {incident.priority}
                            {incident.unit ? ` · Unidad ${incident.unit.reference}` : ''}
                          </div>
                        </td>
                        <td className="px-3 py-3">{incident.community.name}</td>
                        <td className="px-3 py-3">
                          {incident.assignedProvider?.name || 'Sin asignar'}
                        </td>
                        <td className="px-3 py-3">{incident.status}</td>
                        <td className="px-3 py-3">{formatDate(incident.dueAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Actividad general</h2>
          <p className="text-sm text-muted-foreground">
            Indicadores estructurales del backoffice para el despacho.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {activityCards.map((card) => (
            <div key={card.label} className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold">{card.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
