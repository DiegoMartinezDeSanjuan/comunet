import { getCommunityUnitsPageQuery } from '@/modules/communities/server/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Home, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CommunityUnitsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const result = await getCommunityUnitsPageQuery(id)
  if (!result) notFound()

  const { community, buildings, units, session } = result

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href={`/communities/${community.id}`} 
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Unidades de {community.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {units.length} propiedades registradas en {buildings.length} edificios
            </p>
          </div>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role) && (
          <div className="flex gap-2">
            <Link 
              href={`/communities/${community.id}/units/new-building`} 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Nuevo Edificio
            </Link>
            <Link 
              href={`/communities/${community.id}/units/new`} 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Unidad
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/20">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Referencia</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Edificio</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Planta/Puerta</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Coeficiente</th>
                <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Estado</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay unidades registradas en esta comunidad.
                  </td>
                </tr>
              ) : (
                units.map((u: any) => (
                  <tr key={u.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{u.reference}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">{u.building?.name || '-'}</td>
                    <td className="p-4 align-middle">{u.type}</td>
                    <td className="p-4 align-middle">{u.floor || '-'}/{u.door || '-'}</td>
                    <td className="p-4 align-middle text-right">{u.coefficient ? `${u.coefficient}%` : '-'}</td>
                    <td className="p-4 align-middle text-center">
                      {u.active ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-500">Activo</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">Inactivo</span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-right">
                      {['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role) && (
                        <div className="flex items-center justify-end gap-3">
                          <Link 
                            href={`/communities/${community.id}/units/${u.id}/ownership`}
                            className="text-muted-foreground hover:text-primary transition-colors hover:underline"
                          >
                            Titularidad
                          </Link>
                          <Link 
                            href={`/communities/${community.id}/units/${u.id}/edit`}
                            className="text-primary hover:underline"
                          >
                            Editar
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
