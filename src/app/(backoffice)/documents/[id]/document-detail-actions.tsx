'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  archiveDocumentAction,
  updateDocumentAction,
} from '@/modules/documents/server/actions'

type DocumentVisibility = 'INTERNAL' | 'OWNERS' | 'PUBLIC'

type DocumentDetailActionsProps = {
  document: {
    id: string
    title: string
    category: string
    visibility: DocumentVisibility
    archivedAt: string | null
  }
}

export function DocumentDetailActions({ document }: DocumentDetailActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(document.title)
  const [category, setCategory] = useState(document.category)
  const [visibility, setVisibility] = useState<DocumentVisibility>(document.visibility)

  const isArchived = Boolean(document.archivedAt)

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'No se pudo completar la acción.'
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    })
  }

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        await updateDocumentAction(document.id, {
          title,
          category: category.trim() || null,
          visibility,
        })
        toast({
          title: 'Documento actualizado',
          description: 'Los metadatos se han guardado correctamente.',
        })
        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  const handleArchive = () => {
    startTransition(async () => {
      try {
        await archiveDocumentAction(document.id)
        toast({
          title: 'Documento archivado',
          description: 'El documento se ha marcado como archivado.',
        })
        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  return (
    <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="document-edit-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Metadatos del documento</h2>
        <p className="text-sm text-muted-foreground">
          Edita el título, categoría y visibilidad. El archivado es lógico y conserva el fichero.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="document-edit-title" className="text-sm font-medium">
            Título
          </label>
          <Input
            id="document-edit-title"
            data-testid="document-edit-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isPending || isArchived}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="document-edit-category" className="text-sm font-medium">
            Categoría
          </label>
          <Input
            id="document-edit-category"
            data-testid="document-edit-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={isPending || isArchived}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="document-edit-visibility" className="text-sm font-medium">
            Visibilidad
          </label>
          <select
            id="document-edit-visibility"
            data-testid="document-edit-visibility"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as DocumentVisibility)}
            disabled={isPending || isArchived}
          >
            <option value="INTERNAL">INTERNAL</option>
            <option value="OWNERS">OWNERS</option>
            <option value="PUBLIC">PUBLIC</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          data-testid="document-edit-submit"
          onClick={handleUpdate}
          disabled={isPending || isArchived || title.trim().length < 3}
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        <Button
          type="button"
          variant="outline"
          data-testid="document-archive-submit"
          onClick={handleArchive}
          disabled={isPending || isArchived}
        >
          {isPending ? 'Archivando...' : isArchived ? 'Archivado' : 'Archivar'}
        </Button>
      </div>
    </section>
  )
}
