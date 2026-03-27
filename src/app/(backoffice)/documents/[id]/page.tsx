import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { getDocumentDetailQuery } from '@/modules/documents/server/queries'
import { DocumentDetailActions } from './document-detail-actions'

const VISIBILITY_LABELS: Record<string, string> = {
  INTERNAL: 'Interno',
  OWNERS: 'Propietarios',
  PUBLIC: 'Público',
}

function formatDateTime(value: Date): string {
  return new Date(value).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'documents.read')) {
    throw new Error('FORBIDDEN')
  }

  const { id } = await params
  const document = await getDocumentDetailQuery(id)

  if (!document) {
    notFound()
  }

  const canManage = requirePermission(session, 'documents.manage')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/documents" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Volver a documentos
        </Link>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-muted-foreground">
              {document.community.name} · {VISIBILITY_LABELS[document.visibility] ?? document.visibility}
            </p>
          </div>
          <a
            href={`/api/documents/${document.id}/download`}
            className="inline-flex h-10 items-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Descargar documento
          </a>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Categoría</div>
          <div className="mt-1 text-lg font-semibold">{document.category || 'Sin categoría'}</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Tamaño</div>
          <div className="mt-1 text-lg font-semibold">{formatFileSize(document.size)}</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Subido por</div>
          <div className="mt-1 text-lg font-semibold">{document.uploadedBy.name}</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Fecha</div>
          <div className="mt-1 text-lg font-semibold">{formatDateTime(document.createdAt)}</div>
        </div>
      </section>

      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="document-detail-card">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Visibilidad</div>
            <div className="mt-1 font-medium">{VISIBILITY_LABELS[document.visibility] ?? document.visibility}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Mime type</div>
            <div className="mt-1 font-medium">{document.mimeType || 'Sin dato'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Storage path</div>
            <div className="mt-1 break-all text-sm">{document.storagePath}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Archivado</div>
            <div className="mt-1 font-medium">
              {document.archivedAt ? formatDateTime(document.archivedAt) : 'Activo'}
            </div>
          </div>
        </div>
      </section>

      {canManage ? (
        <DocumentDetailActions
          document={{
            id: document.id,
            title: document.title,
            category: document.category ?? '',
            visibility: document.visibility,
            archivedAt: document.archivedAt ? document.archivedAt.toISOString() : null,
          }}
        />
      ) : null}
    </div>
  )
}
