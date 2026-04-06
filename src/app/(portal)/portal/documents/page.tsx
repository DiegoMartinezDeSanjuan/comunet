import { redirect } from 'next/navigation'
import { FileText, FolderOpen, ShieldCheck } from 'lucide-react'

import {
  PortalBadge,
  PortalEmptyState,
} from '@/modules/portal/components/ui'
import { KPICard } from '@/components/ui/kpi-card'
import { formatDate } from '@/lib/formatters'
import { getPortalDocumentsPageQuery } from '@/modules/portal/server/queries'

const DOCUMENT_VISIBILITY_LABELS: Record<string, string> = {
  OWNERS: 'Propietarios',
  PUBLIC: 'Público',
}

export default async function PortalDocumentsPage() {
  const { session, documents } = await getPortalDocumentsPageQuery(24)

  if (session.role === 'PROVIDER') {
    redirect('/portal')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Explora y descarga los documentos que la administración ha publicado para tu comunidad.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          label="Documentos visibles"
          value={documents.length}
          icon={<FileText className="h-5 w-5" />}
        />
        <KPICard
          label="Comunidades con documentación"
          value={new Set(documents.map((document) => document.communityId)).size}
          icon={<FolderOpen className="h-5 w-5" />}
        />
        <KPICard
          label="Descarga Directa Segura"
          value="Segura"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="success"
        />
      </div>

      {documents.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {documents.map((document) => (
            <article key={document.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{document.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{document.community.name}</p>
                </div>
                <PortalBadge tone="info">
                  {DOCUMENT_VISIBILITY_LABELS[document.visibility] ?? document.visibility}
                </PortalBadge>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Categoría</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{document.category || 'Sin categoría'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Publicado</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(document.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Subido por</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{document.uploadedBy.name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Formato</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{document.mimeType || 'Sin dato'}</dd>
                </div>
              </dl>

              <div className="mt-6 flex justify-end">
                <a
                  href={`/api/documents/${document.id}/download`}
                  target="_blank"
                  className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  rel="noreferrer"
                >
                  Descargar Documento
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <PortalEmptyState
          title="Todavía no hay documentos publicados"
          description="Al publicarse documentos relevantes (actas, normativas, recibos unificados) por parte de la administración, aparecerán aquí de forma automática."
        />
      )}
    </div>
  )
}
