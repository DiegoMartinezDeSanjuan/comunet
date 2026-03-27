import { redirect } from 'next/navigation'
import { FileText, FolderOpen, ShieldCheck } from 'lucide-react'

import {
  PortalBadge,
  PortalEmptyState,
  PortalPageHeader,
  PortalStatCard,
} from '@/components/portal/ui'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/formatters'
import { listPortalDocuments } from '@/modules/portal/server/content'

const DOCUMENT_VISIBILITY_LABELS: Record<string, string> = {
  OWNERS: 'Propietarios',
  PUBLIC: 'Público',
}

export default async function PortalDocumentsPage() {
  const session = await requireAuth()

  if (session.role === 'PROVIDER') {
    redirect('/portal')
  }

  const documents = await listPortalDocuments(session, 24)

  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Portal"
        title="Documentos"
        description="Explora y descarga los documentos que la administración ha publicado para tu comunidad."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard
          label="Documentos visibles"
          value={String(documents.length)}
          hint="Solo documentos con visibilidad apta para propietarios en tus comunidades."
          icon={FileText}
        />
        <PortalStatCard
          label="Comunidades con documentación"
          value={String(new Set(documents.map((document) => document.communityId)).size)}
          hint="Comunidades donde ya existe documentación publicada para portal."
          icon={FolderOpen}
        />
        <PortalStatCard
          label="Descarga Directa"
          value="Segura"
          hint="Todos los documentos listados aquí tienen acceso validado por tu cuenta de propietario."
          icon={ShieldCheck}
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
