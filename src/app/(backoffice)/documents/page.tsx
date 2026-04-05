import Link from 'next/link'
import { requirePermission } from '@/lib/permissions'
import { parseDocumentVisibility } from '@/modules/documents/schema'
import {
  listDocumentCategoriesQuery,
  listDocumentCommunitiesQuery,
  listDocumentsQuery,
} from '@/modules/documents/server/queries'
import { DocumentUploadForm } from './document-upload-form'
import { ChevronLeft, ChevronRight, Download, Eye, FileImage, FileSpreadsheet, FileText, FolderOpen, Search, Upload } from 'lucide-react'

export const dynamic = 'force-dynamic'

const VISIBILITY_LABELS: Record<string, string> = {
  INTERNAL: 'Interno',
  OWNERS: 'Propietarios',
  PUBLIC: 'Público',
}

const VISIBILITY_STYLES: Record<string, string> = {
  INTERNAL: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  OWNERS: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUBLIC: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
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

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return { icon: FileText, color: 'text-blue-400 bg-blue-500/15' }
  if (mimeType.startsWith('image/')) return { icon: FileImage, color: 'text-emerald-400 bg-emerald-500/15' }
  if (mimeType.includes('pdf')) return { icon: FileText, color: 'text-red-400 bg-red-500/15' }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return { icon: FileSpreadsheet, color: 'text-emerald-400 bg-emerald-500/15' }
  return { icon: FileText, color: 'text-blue-400 bg-blue-500/15' }
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
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

  const { session } = result
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

  const selectClass = "h-10 w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Repositorio documental con almacenamiento, permisos y descarga controlada.
          </p>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{result.total}</p>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Categorías</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{communities.length}</p>
            <p className="text-xs text-muted-foreground">Comunidades</p>
          </div>
        </div>
      </div>

      {canManage ? <DocumentUploadForm communities={communities} /> : null}

      {/* Filters + Table Card */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <div className="flex flex-col gap-1 mb-4">
            <h2 className="text-base font-semibold">Listado</h2>
            <p className="text-xs text-muted-foreground">
              Mostrando {startItem}-{endItem} de {result.total} documentos.
            </p>
          </div>

          <form className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Título, categoría o comunidad"
                className="h-10 w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <select name="communityId" defaultValue={communityId} className={selectClass}>
              <option value="">Comunidad</option>
              {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select name="category" defaultValue={category} className={selectClass}>
              <option value="">Categoría</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <select name="visibility" defaultValue={visibility ?? ''} className={selectClass}>
                <option value="">Visibilidad</option>
                {Object.entries(VISIBILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 md:col-span-5">
              <button className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Filtrar</button>
              <Link href="/documents" className="inline-flex h-9 items-center rounded-xl border border-border/50 px-4 text-sm font-medium hover:bg-muted/20 transition-colors">Limpiar</Link>
            </div>
          </form>
        </div>

        {result.items.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No se han encontrado documentos con esos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/10">
                  <th className="h-11 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento</th>
                  <th className="h-11 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comunidad</th>
                  <th className="h-11 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría</th>
                  <th className="h-11 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visibilidad</th>
                  <th className="h-11 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Peso</th>
                  <th className="h-11 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                  <th className="h-11 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((document) => (
                  <tr key={document.id} className="border-b border-border/30 transition-colors hover:bg-muted/10">
                    <td className="p-4 align-middle">
                      {(() => {
                        const { icon: Icon, color } = getFileIcon(document.mimeType)
                        return (
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{document.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {document.mimeType || 'Sin tipo'}{document.archivedAt ? ' · Archivado' : ''}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="p-4 align-middle">{document.community.name}</td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex rounded-lg bg-muted/20 px-2 py-0.5 text-xs">{document.category || 'Sin categoría'}</span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${VISIBILITY_STYLES[document.visibility] ?? ''}`}>
                        {VISIBILITY_LABELS[document.visibility] ?? document.visibility}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{formatFileSize(document.size)}</td>
                    <td className="p-4 align-middle text-muted-foreground">{formatDate(document.createdAt)}</td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-1.5">
                        <Link href={`/documents/${document.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Ver documento">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <a href={`/api/documents/${document.id}/download`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors" title="Descargar">
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3 text-sm">
          <span className="text-muted-foreground">Página {result.page} de {result.totalPages}</span>
          <div className="flex gap-1">
            {result.hasPreviousPage ? (
              <Link href={buildHref(result.page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40"><ChevronLeft className="h-4 w-4" /></span>
            )}
            {result.hasNextPage ? (
              <Link href={buildHref(result.page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40"><ChevronRight className="h-4 w-4" /></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
