'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { createProviderAction } from '@/modules/providers/server/actions'

export function ProviderCreateForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

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
    <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Nuevo proveedor</h2>
        <p className="text-sm text-muted-foreground">
          Crea una ficha de proveedor para poder asignarlo a incidencias.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Fontaneria Lopez"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria</label>
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Fontaneria, ascensores, limpieza..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">CIF</label>
          <Input
            value={cif}
            onChange={(event) => setCif(event.target.value)}
            placeholder="B12345678"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefono</label>
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="600123123"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="proveedor@ejemplo.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Direccion</label>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Calle, numero, ciudad"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Notas</label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Condiciones, horarios, alcance del servicio..."
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || name.trim().length < 2}
        >
          {isPending ? 'Guardando...' : 'Crear proveedor'}
        </Button>
      </div>
    </section>
  )
}
