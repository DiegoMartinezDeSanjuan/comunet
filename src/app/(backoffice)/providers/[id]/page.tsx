import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requirePermission } from '@/lib/permissions'
import { getProviderDetailQuery } from '@/modules/providers/server/queries'

import { ProviderDetailClient } from './provider-detail-client'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

function formatDateTime(value: Date | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-ES')
}

function formatIncidentBadge(status: string): string {
  switch (status) {
    case 'CLOSED':
      return 'border-red-200 bg-red-50 text-red-700'
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

export default async function ProviderDetailPage({ params }: PageProps) {
  const { id } = await params

  const { detail, session } = await getProviderDetailQuery(id)

  if (!detail) {
    notFound()
  }

  const canManage = requirePermission(session, 'providers.manage')

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/providers"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Volver a proveedores
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {detail.provider.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {detail.provider.category || 'Sin categoria'}
          {detail.provider.archivedAt ? ' · Archivado' : ''}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Categoria</div>
          <div className="mt-2 text-sm font-medium">
            {detail.provider.category || '-'}
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Activas</div>
          <div className="mt-2 text-2xl font-semibold">{detail.activeCount}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Cerradas</div>
          <div className="mt-2 text-2xl font-semibold">{detail.closedCount}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Ultima actividad</div>
          <div className="mt-2 text-sm font-medium">
            {formatDateTime(detail.lastActivityAt)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Datos generales</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="font-medium">CIF</dt>
                <dd className="text-muted-foreground">{detail.provider.cif || '-'}</dd>
              </div>
              <div>
                <dt className="font-medium">Email</dt>
                <dd className="text-muted-foreground">{detail.provider.email || '-'}</dd>
              </div>
              <div>
                <dt className="font-medium">Telefono</dt>
                <dd className="text-muted-foreground">{detail.provider.phone || '-'}</dd>
              </div>
              <div>
                <dt className="font-medium">Direccion</dt>
                <dd className="text-muted-foreground">{detail.provider.address || '-'}</dd>
              </div>
              <div>
                <dt className="font-medium">Notas</dt>
                <dd className="whitespace-pre-wrap text-muted-foreground">
                  {detail.provider.notes || 'Sin notas internas.'}
                </dd>
              </div>
            </dl>
          </section>

          {canManage ? (
            <ProviderDetailClient
              provider={{
                id: detail.provider.id,
                name: detail.provider.name,
                cif: detail.provider.cif ?? '',
                email: detail.provider.email ?? '',
                phone: detail.provider.phone ?? '',
                category: detail.provider.category ?? '',
                address: detail.provider.address ?? '',
                notes: detail.provider.notes ?? '',
                archived: Boolean(detail.provider.archivedAt),
              }}
            />
          ) : (
            <section className="rounded-lg border bg-card text-card-foreground p-6 text-sm text-muted-foreground shadow-sm">
              Tu rol tiene acceso de lectura sobre este proveedor, pero no puede
              editar su ficha.
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Incidencias activas</h2>
              <p className="text-sm text-muted-foreground">
                Ultimas incidencias abiertas, asignadas o en seguimiento.
              </p>
            </div>

            {detail.activeIncidents.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Este proveedor no tiene incidencias activas.
              </div>
            ) : (
              <div className="space-y-3">
                {detail.activeIncidents.map((incident) => (
                  <div key={incident.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {incident.community.name}
                          {incident.unit ? ` · Unidad ${incident.unit.reference}` : ''}
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${formatIncidentBadge(incident.status)}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Ver incidencia
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Incidencias cerradas</h2>
              <p className="text-sm text-muted-foreground">
                Ultimas incidencias resueltas o cerradas administrativamente.
              </p>
            </div>

            {detail.closedIncidents.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Aun no hay incidencias cerradas para este proveedor.
              </div>
            ) : (
              <div className="space-y-3">
                {detail.closedIncidents.map((incident) => (
                  <div key={incident.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {incident.community.name}
                          {incident.unit ? ` · Unidad ${incident.unit.reference}` : ''}
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${formatIncidentBadge(incident.status)}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Ver incidencia
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}
