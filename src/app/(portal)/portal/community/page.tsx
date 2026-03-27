import { requireAuth } from '@/lib/auth'
import { getPortalCommunitySummary } from '@/modules/portal/server/content'
import Link from 'next/link'

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mi Comunidad</h1>
        <p className="mt-2 text-muted-foreground">
          Resumen de tu estado, propiedades y datos de contacto de tu administración.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/portal/receipts">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary">
            <h3 className="font-semibold text-card-foreground">Recibos Pendientes</h3>
            <p className="mt-2 text-4xl font-bold text-primary">{summary.stats.pendingReceipts}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Haz clic para ver tus recibos y métodos de pago.
            </p>
          </div>
        </Link>
        <Link href="/portal/incidents">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary">
            <h3 className="font-semibold text-card-foreground">Tus Incidencias</h3>
            <p className="mt-2 text-4xl font-bold text-primary">{summary.stats.activeIncidents}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Haz clic para revisar el estado de tus partes.
            </p>
          </div>
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
