'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { uploadDocumentAction } from '@/modules/documents/server/actions'

type CommunityOption = {
  id: string
  name: string
}

type DocumentUploadFormProps = {
  communities: CommunityOption[]
}

export function DocumentUploadForm({ communities }: DocumentUploadFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState<'INTERNAL' | 'OWNERS' | 'PUBLIC'>('INTERNAL')

  const handleSubmit = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast({
        title: 'Adjunta un archivo',
        description: 'Debes seleccionar un archivo para subirlo al repositorio documental.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('communityId', communityId)
        formData.set('title', title)
        formData.set('category', category)
        formData.set('visibility', visibility)
        formData.set('file', file)

        const created = await uploadDocumentAction(formData)
        toast({
          title: 'Documento subido',
          description: 'El documento se ha guardado correctamente.',
        })
        router.push(`/documents/${created.id}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo subir el documento.'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="document-upload-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Nuevo documento</h2>
        <p className="text-sm text-muted-foreground">
          Repositorio documental interno con almacenamiento local y visibilidad controlada.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="document-upload-title" className="text-sm font-medium">
            Título
          </label>
          <Input
            id="document-upload-title"
            data-testid="document-upload-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Convocatoria junta ordinaria abril 2026"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="document-upload-community" className="text-sm font-medium">
            Comunidad
          </label>
          <select
            id="document-upload-community"
            data-testid="document-upload-community"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={communityId}
            onChange={(event) => setCommunityId(event.target.value)}
          >
            <option value="">Selecciona una comunidad</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="document-upload-category" className="text-sm font-medium">
            Categoría
          </label>
          <Input
            id="document-upload-category"
            data-testid="document-upload-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Actas, contratos, seguros, comunicados..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="document-upload-visibility" className="text-sm font-medium">
            Visibilidad
          </label>
          <select
            id="document-upload-visibility"
            data-testid="document-upload-visibility"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as 'INTERNAL' | 'OWNERS' | 'PUBLIC')}
          >
            <option value="INTERNAL">INTERNAL</option>
            <option value="OWNERS">OWNERS</option>
            <option value="PUBLIC">PUBLIC</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="document-upload-file" className="text-sm font-medium">
            Archivo
          </label>
          <input
            id="document-upload-file"
            data-testid="document-upload-file"
            ref={fileInputRef}
            type="file"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          data-testid="document-upload-submit"
          onClick={handleSubmit}
          disabled={isPending || !communityId || title.trim().length < 3}
        >
          {isPending ? 'Subiendo...' : 'Subir documento'}
        </Button>
      </div>
    </section>
  )
}
