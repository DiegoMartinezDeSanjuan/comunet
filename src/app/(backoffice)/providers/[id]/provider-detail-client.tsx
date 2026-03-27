'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { updateProviderAction } from '@/modules/providers/server/actions'

type ProviderDetailClientProps = {
  provider: {
    id: string
    name: string
    cif: string
    email: string
    phone: string
    category: string
    address: string
    notes: string
    archived: boolean
  }
}

export function ProviderDetailClient({ provider }: ProviderDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(provider.name)
  const [cif, setCif] = useState(provider.cif)
  const [email, setEmail] = useState(provider.email)
  const [phone, setPhone] = useState(provider.phone)
  const [category, setCategory] = useState(provider.category)
  const [address, setAddress] = useState(provider.address)
  const [notes, setNotes] = useState(provider.notes)
  const [archived, setArchived] = useState(provider.archived)

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await updateProviderAction(provider.id, {
          name,
          cif: cif.trim() ? cif.trim() : null,
          email: email.trim() ? email.trim() : null,
          phone: phone.trim() ? phone.trim() : null,
          category: category.trim() ? category.trim() : null,
          address: address.trim() ? address.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          archived,
        })

        toast({
          title: 'Proveedor actualizado',
          description: 'La ficha del proveedor se ha guardado.',
        })

        router.refresh()
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar el proveedor.'

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
        <h2 className="text-lg font-semibold">Editar proveedor</h2>
        <p className="text-sm text-muted-foreground">
          Actualiza datos de contacto, categoria y estado de archivado.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria</label>
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">CIF</label>
          <Input value={cif} onChange={(event) => setCif(event.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefono</label>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Direccion</label>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Notas</label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium md:col-span-2">
          <input
            type="checkbox"
            checked={archived}
            onChange={(event) => setArchived(event.target.checked)}
            className="h-4 w-4 rounded border"
          />
          Proveedor archivado
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || name.trim().length < 2}
        >
          {isPending ? 'Guardando...' : 'Guardar proveedor'}
        </Button>
      </div>
    </section>
  )
}
