'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { createProviderAction } from '@/modules/providers/server/actions'
import { ChevronDown, Wrench } from 'lucide-react'

export function ProviderCreateForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const [name, setName] = useState('')
  const [cif, setCif] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const provider = await createProviderAction({
          name,
          cif: cif.trim() ? cif.trim() : null,
          email: email.trim() ? email.trim() : null,
          phone: phone.trim() ? phone.trim() : null,
          category: category.trim() ? category.trim() : null,
          address: address.trim() ? address.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        })

        toast({
          title: 'Proveedor creado',
          description: 'La ficha del proveedor se ha guardado correctamente.',
        })

        router.push(`/providers/${provider.id}`)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo crear el proveedor.'

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <section className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Nuevo proveedor</h2>
            <p className="text-xs text-muted-foreground">
              Crea una ficha de proveedor para poder asignarlo a incidencias.
            </p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Collapsible Body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border/30 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nombre</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Fontaneria Lopez"
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Fontaneria, ascensores, limpieza..."
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">CIF</label>
              <Input
                value={cif}
                onChange={(event) => setCif(event.target.value)}
                placeholder="B12345678"
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="600123123"
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="proveedor@ejemplo.com"
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dirección</label>
              <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Calle, numero, ciudad"
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Condiciones, horarios, alcance del servicio..."
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || name.trim().length < 2}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110"
            >
              {isPending ? 'Guardando...' : 'Crear proveedor'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
