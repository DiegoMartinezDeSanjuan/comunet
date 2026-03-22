import { requireAuth } from '@/lib/auth'
import { getOwners } from '@/modules/contacts/server/contact-service'
import { Search, UserCircle, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await requireAuth()
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''
  
  const owners = await getOwners(session.officeId, query)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Propietarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Diccionario global de propietarios del despacho.</p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'].includes(session.role) && (
          <Link 
            href="/owners/new" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Propietario
          </Link>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <form className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar por nombre, DNI, o email..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm pl-9"
          />
        </form>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Propietario</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">DNI/NIF</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Contacto</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {owners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No se encontraron propietarios.
                  </td>
                </tr>
              ) : (
                owners.map((owner) => (
                  <tr key={owner.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                          <UserCircle className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-foreground">{owner.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">{owner.dni || '-'}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{owner.email || '-'}</span>
                        <span className="text-xs text-muted-foreground">{owner.phone || ''}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link 
                        href={`/owners/${owner.id}`}
                        className="text-primary hover:underline text-sm font-medium pr-2"
                      >
                        Ver Ficha
                      </Link>
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
