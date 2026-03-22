import { requireAuth } from '@/lib/auth'
import { getTenants } from '@/modules/contacts/server/contact-service'
import { Search, Users, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await requireAuth()
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''
  
  const tenants = await getTenants(session.officeId, query)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inquilinos</h1>
          <p className="text-sm text-muted-foreground mt-1">Diccionario global de inquilinos del despacho.</p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'].includes(session.role) && (
          <Link 
            href="/tenants/new" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Inquilino
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
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Inquilino</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">DNI/NIF</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Contacto</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No se encontraron inquilinos.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                          <Users className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-foreground">{tenant.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">{tenant.dni || '-'}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{tenant.email || '-'}</span>
                        <span className="text-xs text-muted-foreground">{tenant.phone || ''}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link 
                        href={`/tenants/${tenant.id}/edit`}
                        className="text-primary hover:underline text-sm font-medium pr-2"
                      >
                        Editar
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
