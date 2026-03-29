import { requireAuth } from '@/lib/auth'
import { getPortalCommunitySummary } from '@/modules/portal/server/content'
import Link from 'next/link'
import { KPICard } from '@/components/ui/kpi-card'
import { AlertTriangle, Receipt } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  PRESIDENT: 'Presidente',
  VICE_PRESIDENT: 'Vicepresidente',
  SECRETARY: 'Secretario',
  VOCAL: 'Vocal',
}

export default async function Page() {
  const session = await requireAuth()
  const summary = await getPortalCommunitySummary(session)

  if (!summary) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No tienes información de comunidad disponible.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Comunidad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumen de tu estado, propiedades y datos de contacto de tu administración.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/portal/receipts">
          <KPICard
            label="Recibos Pendientes"
            value={summary.stats.pendingReceipts}
            icon={<Receipt className="h-5 w-5" />}
            className="hover:border-primary cursor-pointer"
            accent={summary.stats.pendingReceipts > 0 ? "warning" : "default"}
          />
        </Link>
        <Link href="/portal/incidents">
          <KPICard
            label="Tus Incidencias"
            value={summary.stats.activeIncidents}
            icon={<AlertTriangle className="h-5 w-5" />}
            className="hover:border-primary cursor-pointer"
            accent={summary.stats.activeIncidents > 0 ? "warning" : "default"}
          />
        </Link>
      </div>

      <div className="space-y-6">
        {summary.communities.map((community) => (
          <section key={community.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-card-foreground">{community.name}</h2>
              <p className="text-sm text-muted-foreground">{community.address}</p>
            </div>

            {community.boardPositions.length > 0 && (
              <div className="mb-6 rounded-md bg-primary/10 p-3">
                <p className="text-sm font-medium text-primary">
                  Cargos activos del board:{' '}
                  {community.boardPositions.map(p => ROLE_LABELS[p.role] || p.role).join(', ')}
                </p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-card-foreground">Mis propiedades vinculadas</h3>
              <ul className="space-y-2">
                {community.units.map(unit => (
                  <li key={unit.id} className="rounded-md border p-3 text-sm">
                    Ref: <strong>{unit.reference}</strong> — Planta {unit.floor}{unit.door && `, Puerta ${unit.door}`} 
                    <span className="ml-2 text-muted-foreground">({String(unit.areaM2)} m²)</span>
                  </li>
                ))}
              </ul>
              {community.units.length === 0 && (
                <p className="text-sm text-muted-foreground">No tienes unidades vinculadas directamente.</p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Datos de la Administración</h3>
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <div>
                  <span className="block text-xs text-muted-foreground">Nombre</span>
                  <span>{community.office.name}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">Teléfono</span>
                  <span>{community.office.phone || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">Email</span>
                  <span>{community.office.email || '-'}</span>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
