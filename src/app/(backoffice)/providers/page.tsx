import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/permissions'
import { listProvidersQuery } from '@/modules/providers/server/queries'
import { ProviderCreateForm } from './provider-create-form'
import { ChevronLeft, ChevronRight, Mail, Phone, Search, Wrench } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.trunc(parsed)
}

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Fontanería: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-l-blue-500' },
  Electricidad: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-l-amber-500' },
  Ascensores: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-l-purple-500' },
  Pintura: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-l-rose-500' },
  Limpieza: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-l-emerald-500' },
}

function getCategoryColor(category: string | null) {
  if (!category) return { bg: 'bg-muted/20', text: 'text-muted-foreground', border: 'border-l-border' }
  return CATEGORY_COLORS[category] ?? { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-l-cyan-500' }
}

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAuth()
  const params = await searchParams

  const q = getParam(params.q)
  const category = getParam(params.category)
  const archivedParam = getParam(params.archived)
  const page = parsePositiveInt(getParam(params.page), 1)
  const pageSize = 20

  const archived =
    archivedParam === 'true'
      ? true
      : archivedParam === 'false'
        ? false
        : undefined

  const [result, categories] = await Promise.all([
    listProvidersQuery(
      {
        search: q || undefined,
        category: category || undefined,
        archived,
      },
      { page, pageSize },
    ),
    prisma.provider.findMany({
      where: { officeId: session.officeId },
      select: { category: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const canManage = requirePermission(session, 'providers.manage')
  const startItem = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const endItem = result.total === 0 ? 0 : Math.min(result.page * result.pageSize, result.total)

  const categoryOptions = Array.from(
    new Set(
      categories
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value)),
    ),
  )

  const activeCount = result.items.filter(p => !p.archivedAt).length

  const buildHref = (targetPage: number) => {
    const query = new URLSearchParams()
    if (q) query.set('q', q)
    if (category) query.set('category', category)
    if (archivedParam) query.set('archived', archivedParam)
    if (targetPage > 1) query.set('page', String(targetPage))
    const search = query.toString()
    return search ? `/providers?${search}` : '/providers'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Directorio operativo con datos de contacto, categoría y vínculo con incidencias asignadas.
          </p>
        </div>
      </div>

      {/* Category Pill Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/providers"
          className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors ${
            !category ? 'bg-primary text-primary-foreground' : 'border border-border/50 bg-card/50 hover:bg-muted/20'
          }`}
        >
          Todos
        </Link>
        {categoryOptions.map((cat) => {
          const colors = getCategoryColor(cat)
          const isActive = category === cat
          return (
            <Link
              key={cat}
              href={`/providers?category=${encodeURIComponent(cat)}`}
              className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                isActive
                  ? `${colors.bg} ${colors.text} border border-current/30`
                  : 'border border-border/50 bg-card/50 hover:bg-muted/20'
              }`}
            >
              {cat}
            </Link>
          )
        })}

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar proveedor..."
              className="h-9 w-56 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </form>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-1 text-sm text-muted-foreground">
        <span><strong className="text-foreground">{result.total}</strong> Total proveedores</span>
        <span><strong className="text-foreground">{activeCount}</strong> Activos en vista</span>
        <span>Mostrando {startItem}-{endItem}</span>
      </div>

      {canManage ? (
        <div id="provider-form">
          <ProviderCreateForm />
        </div>
      ) : null}

      {/* Provider Card Grid */}
      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-card/30 p-12 text-center">
          <Wrench className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No hay proveedores que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((provider) => {
            const colors = getCategoryColor(provider.category)
            const isArchived = !!provider.archivedAt
            return (
              <Link
                key={provider.id}
                href={`/providers/${provider.id}`}
                className={`group relative rounded-xl border border-l-4 ${colors.border} border-border/50 bg-card/50 backdrop-blur-sm p-5 transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-card/80 ${isArchived ? 'opacity-60' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.text} text-lg font-bold`}>
                    {provider.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-foreground truncate group-hover:text-primary transition-colors ${isArchived ? 'line-through' : ''}`}>
                      {provider.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Status dot */}
                      <span className={`inline-block h-2 w-2 rounded-full ${isArchived ? 'bg-slate-500' : 'bg-emerald-500'}`} />
                      <span className="text-xs text-muted-foreground">
                        {isArchived ? 'Archivado' : 'Activo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Tag */}
                {provider.category && (
                  <div className="mt-3">
                    <span className={`inline-flex rounded-full ${colors.bg} ${colors.text} border border-current/20 px-2.5 py-0.5 text-xs font-medium`}>
                      {provider.category}
                    </span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mt-3 space-y-1">
                  {provider.email && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      {provider.email}
                    </p>
                  )}
                  {provider.phone && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      {provider.phone}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/60">{provider.cif || 'Sin CIF'}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Página {result.page} de {result.totalPages}</span>
        <div className="flex gap-1">
          {result.hasPreviousPage ? (
            <Link href={buildHref(result.page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"><ChevronLeft className="h-4 w-4" /></Link>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40"><ChevronLeft className="h-4 w-4" /></span>
          )}
          {result.hasNextPage ? (
            <Link href={buildHref(result.page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"><ChevronRight className="h-4 w-4" /></Link>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40"><ChevronRight className="h-4 w-4" /></span>
          )}
        </div>
      </div>
    </div>
  )
}
