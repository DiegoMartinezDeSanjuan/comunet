'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ownerSchema, type OwnerInput } from '@/modules/contacts/schema'
import { createOwnerAction, updateOwnerAction } from '@/modules/contacts/server/contact-actions'

interface Props {
  initialData?: Partial<OwnerInput> & { id?: string }
}

export function OwnerForm({ initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<OwnerInput>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      dni: initialData?.dni || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      notes: initialData?.notes || '',
      iban: initialData?.iban || '',
    },
  })

  function onSubmit(data: OwnerInput) {
    startTransition(async () => {
      const result = initialData?.id
        ? await updateOwnerAction(initialData.id, data)
        : await createOwnerAction(data)
        
      if (result.success && result.data) {
        toast.success(initialData?.id ? 'Propietario actualizado' : 'Propietario creado')
        router.push(`/owners/${result.data.id}`)
      } else {
        toast.error('Error', { description: result.error || 'No se pudo guardar el propietario.' })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre completo / Razón Social *</label>
          <input
            {...form.register('fullName')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">DNI / NIF</label>
          <input
            {...form.register('dni')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            {...form.register('email')}
            type="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Teléfono</label>
          <input
            {...form.register('phone')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Dirección Postal</label>
          <input
            {...form.register('address')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">IBAN (Recibos domiciliados)</label>
          <input
            {...form.register('iban')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder="ES91..."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Anotaciones (privado)</label>
          <textarea
            {...form.register('notes')}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? 'Guardando...' : initialData?.id ? 'Actualizar Propietario' : 'Guardar Propietario'}
        </button>
      </div>
    </form>
  )
}
