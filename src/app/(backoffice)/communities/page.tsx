import { listCommunitiesPageQuery } from '@/modules/communities/server/queries'
import { Building2, Home, MapPin, Plus, Search, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''

  const { communities, session } = await listCommunitiesPageQuery(query)

  const totalUnits = communities.reduce((sum, c) => sum + c._count.units, 0)
  const canManage = ['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comunidades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las comunidades de propietarios del despacho
          </p>
        </div>

        {canManage && (
          <Link
            href="/communities/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Nueva Comunidad
          </Link>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{communities.length}</p>
            <p className="text-xs text-muted-foreground">Comunidades</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalUnits}</p>
            <p className="text-xs text-muted-foreground">Unidades</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{communities.length > 0 ? Math.round(totalUnits / communities.length) : 0}</p>
            <p className="text-xs text-muted-foreground">Media uds/comunidad</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre o CIF..."
          className="h-10 w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
      </form>

      {/* Community cards grid */}
      {communities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-card/30 p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No se encontraron comunidades.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}`}
              className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-card/80"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {community.name}
                  </h3>
                  {community.address && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {community.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Home className="mr-1 h-3 w-3" />
                  {community._count.units} uds
                </span>
                {community.cif && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {community.cif}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
