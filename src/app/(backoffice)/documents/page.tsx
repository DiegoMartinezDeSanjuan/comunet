import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { parseDocumentVisibility } from '@/modules/documents/schema'
import {
  listDocumentCategoriesQuery,
  listDocumentCommunitiesQuery,
  listDocumentsQuery,
} from '@/modules/documents/server/queries'
import { DocumentUploadForm } from './document-upload-form'

export const dynamic = 'force-dynamic'

const VISIBILITY_LABELS: Record<string, string> = {
  INTERNAL: 'Interno',
  OWNERS: 'Propietarios',
  PUBLIC: 'Público',
}

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

function formatDate(value: Date): string {
  return new Date(value).toLocaleDateString('es-ES')
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'documents.read')) {
    throw new Error('FORBIDDEN')
  }

  const params = await searchParams
  const q = getParam(params.q)
  const communityId = getParam(params.communityId)
  const category = getParam(params.category)
  const visibility = parseDocumentVisibility(getParam(params.visibility))
  const archivedValue = getParam(params.archived)
  const archived = archivedValue === '1' ? true : archivedValue === '0' ? false : undefined
  const page = parsePositiveInt(getParam(params.page), 1)
  const pageSize = 20

  const [result, communities, categories] = await Promise.all([
    listDocumentsQuery(
      {
        search: q || undefined,
        communityId: communityId || undefined,
        category: category || undefined,
        visibility,
        archived,
      },
      { page, pageSize },
    ),
    listDocumentCommunitiesQuery(),
    listDocumentCategoriesQuery(),
  ])

  const canManage = requirePermission(session, 'documents.manage')
  const startItem = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const endItem = result.total === 0 ? 0 : Math.min(result.page * result.pageSize, result.total)

  const buildHref = (targetPage: number) => {
    const query = new URLSearchParams()
    if (q) query.set('q', q)
    if (communityId) query.set('communityId', communityId)
    if (category) query.set('category', category)
    if (visibility) query.set('visibility', visibility)
    if (archivedValue) query.set('archived', archivedValue)
    if (targetPage > 1) query.set('page', String(targetPage))
    const search = query.toString()
    return search ? `/documents?${search}` : '/documents'
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground">
            Repositorio documental del backoffice con almacenamiento local, permisos y descarga controlada.
          </p>
        </div>
      </header>

      {canManage ? <DocumentUploadForm communities={communities} /> : null}

      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="documents-list-card">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Listado</h2>
          <p className="text-sm text-muted-foreground">
            Mostrando {startItem}-{endItem} de {result.total} documentos.
          </p>
        </div>

        <form className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="documents-search" className="text-sm font-medium">
              Buscar
            </label>
            <input
              id="documents-search"
              name="q"
              defaultValue={q}
              placeholder="Título, categoría o comunidad"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="documents-community" className="text-sm font-medium">
              Comunidad
            </label>
            <select
              id="documents-community"
              name="communityId"
              defaultValue={communityId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="documents-category" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="documents-category"
              name="category"
              defaultValue={category}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="documents-visibility" className="text-sm font-medium">
              Visibilidad
            </label>
            <select
              id="documents-visibility"
              name="visibility"
              defaultValue={visibility ?? ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="documents-archived" className="text-sm font-medium">
              Estado
            </label>
            <select
              id="documents-archived"
              name="archived"
              defaultValue={archivedValue}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="0">Activos</option>
              <option value="1">Archivados</option>
            </select>
          </div>

          <div className="flex items-end gap-2 md:col-span-5">
            <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Filtrar
            </button>
            <Link
              href="/documents"
              className="inline-flex h-10 items-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Limpiar
            </Link>
          </div>
        </form>

        {result.items.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No se han encontrado documentos con esos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Documento</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Comunidad</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Visibilidad</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Peso</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Subido por</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((document) => (
                  <tr key={document.id} data-testid={`document-row-${document.id}`}>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{document.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {document.mimeType || 'Sin tipo MIME'}
                        {document.archivedAt ? ' · Archivado' : ''}
                      </div>
                    </td>
                    <td className="p-4 align-middle">{document.community.name}</td>
                    <td className="p-4 align-middle">{document.category || 'Sin categoría'}</td>
                    <td className="p-4 align-middle">{VISIBILITY_LABELS[document.visibility] ?? document.visibility}</td>
                    <td className="p-4 align-middle">{formatFileSize(document.size)}</td>
                    <td className="p-4 align-middle">{document.uploadedBy.name}</td>
                    <td className="p-4 align-middle">{formatDate(document.createdAt)}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/documents/${document.id}`} className="text-primary underline-offset-4 hover:underline">
                          Ver
                        </Link>
                        <a
                          href={`/api/documents/${document.id}/download`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Descargar
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <span>
            Página {result.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {result.hasPreviousPage ? (
              <Link className="rounded-md border px-3 py-2" href={buildHref(result.page - 1)}>
                Anterior
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-2 text-muted-foreground">Anterior</span>
            )}

            {result.hasNextPage ? (
              <Link className="rounded-md border px-3 py-2" href={buildHref(result.page + 1)}>
                Siguiente
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-2 text-muted-foreground">Siguiente</span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
