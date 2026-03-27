import { requireAuth } from '@/lib/auth'
import { getCommunities } from '@/modules/communities/server/community-service'
import { Building2, Plus, Search } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await requireAuth()
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''
  
  const communities = await getCommunities(session.officeId, query)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comunidades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las comunidades de propietarios del despacho
          </p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'].includes(session.role) && (
          <Link 
            href="/communities/new" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Comunidad
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
            placeholder="Buscar por nombre o CIF..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          />
        </form>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Comunidad</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">CIF</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Unidades</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {communities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground h-24">
                    No se encontraron comunidades.
                  </td>
                </tr>
              ) : (
                communities.map((community) => (
                  <tr key={community.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{community.name}</span>
                          {community.address && <span className="text-xs text-muted-foreground">{community.address}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">{community.cif || '-'}</td>
                    <td className="p-4 align-middle">{community._count.units}</td>
                    <td className="p-4 align-middle text-right">
                      <Link 
                        href={`/communities/${community.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      >
                        Ver detalles
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
