'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { uploadDocumentAction } from '@/modules/documents/server/actions'
import { ChevronDown, CloudUpload, Upload } from 'lucide-react'

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
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

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

  const selectClass = "h-10 w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"

  return (
    <section className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden" data-testid="document-upload-card">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CloudUpload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Subir Documento</h2>
            <p className="text-xs text-muted-foreground">
              Arrastra o selecciona un archivo para subirlo al repositorio.
            </p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Collapsible Body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border/30 p-5">
          <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                isDragging
                  ? 'border-primary bg-primary/10 scale-[1.02]'
                  : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-border/50 bg-card/30 hover:border-border hover:bg-card/50'
              }`}
            >
              {selectedFile ? (
                <>
                  <Upload className="h-8 w-8 text-emerald-400 mb-2" />
                  <p className="text-sm font-medium text-emerald-400">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click para cambiar
                  </p>
                </>
              ) : (
                <>
                  <CloudUpload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop zone...</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">o haz click para seleccionar</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                data-testid="document-upload-file"
                onChange={handleFileChange}
              />
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="document-upload-title" className="text-xs font-medium text-muted-foreground">Título</label>
                <Input
                  id="document-upload-title"
                  data-testid="document-upload-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej. Convocatoria junta ordinaria abril 2026"
                  className="rounded-xl border-border/50 bg-card/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="document-upload-community" className="text-xs font-medium text-muted-foreground">Comunidad</label>
                  <select
                    id="document-upload-community"
                    data-testid="document-upload-community"
                    className={selectClass}
                    value={communityId}
                    onChange={(event) => setCommunityId(event.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="document-upload-category" className="text-xs font-medium text-muted-foreground">Categoría</label>
                  <Input
                    id="document-upload-category"
                    data-testid="document-upload-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Actas, contratos..."
                    className="rounded-xl border-border/50 bg-card/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="document-upload-visibility" className="text-xs font-medium text-muted-foreground">Visibilidad</label>
                <select
                  id="document-upload-visibility"
                  data-testid="document-upload-visibility"
                  className={selectClass}
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as 'INTERNAL' | 'OWNERS' | 'PUBLIC')}
                >
                  <option value="INTERNAL">Interno</option>
                  <option value="OWNERS">Propietarios</option>
                  <option value="PUBLIC">Público</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              data-testid="document-upload-submit"
              onClick={handleSubmit}
              disabled={isPending || !communityId || title.trim().length < 3}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110"
            >
              {isPending ? 'Subiendo...' : 'Subir documento'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
