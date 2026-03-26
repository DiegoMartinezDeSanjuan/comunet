import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/permissions'
import { listProvidersQuery } from '@/modules/providers/server/queries'

import { ProviderCreateForm } from './provider-create-form'

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

function formatDate(value: Date | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-ES')
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
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
        <p className="text-sm text-muted-foreground">
          Directorio operativo con datos de contacto, categoria y vinculo con
          incidencias asignadas.
        </p>
      </header>

      {canManage ? <ProviderCreateForm /> : null}

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Listado</h2>
          <p className="text-sm text-muted-foreground">
            Mostrando {startItem}-{endItem} de {result.total} proveedores.
          </p>
        </div>

        <form className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, CIF, telefono o email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />

          <select
            name="category"
            defaultValue={category}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas las categorias</option>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            name="archived"
            defaultValue={archivedParam}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Activos y archivados</option>
            <option value="false">Solo activos</option>
            <option value="true">Solo archivados</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Filtrar
            </button>
            <Link
              href="/providers"
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              Limpiar
            </Link>
          </div>
        </form>

        {result.items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay proveedores que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Proveedor</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Contacto</th>
                  <th className="px-3 py-2 font-medium">Archivado</th>
                  <th className="px-3 py-2 font-medium">Actualizado</th>
                  <th className="px-3 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((provider) => (
                  <tr key={provider.id} className="border-b align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {provider.cif || 'Sin CIF'}
                      </div>
                    </td>
                    <td className="px-3 py-3">{provider.category || '-'}</td>
                    <td className="px-3 py-3">
                      <div>{provider.email || '-'}</div>
                      <div className="text-xs text-muted-foreground">
                        {provider.phone || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {provider.archivedAt ? 'Si' : 'No'}
                    </td>
                    <td className="px-3 py-3">
                      {formatDate(provider.updatedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/providers/${provider.id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Pagina {result.page} de {result.totalPages}
          </div>

          <div className="flex gap-2">
            {result.hasPreviousPage ? (
              <Link
                href={buildHref(result.page - 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                Anterior
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-muted-foreground">
                Anterior
              </span>
            )}

            {result.hasNextPage ? (
              <Link
                href={buildHref(result.page + 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                Siguiente
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-muted-foreground">
                Siguiente
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
