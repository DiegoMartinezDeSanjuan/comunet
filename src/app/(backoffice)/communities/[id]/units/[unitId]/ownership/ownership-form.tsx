'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ownershipSchema, type OwnershipInput } from '@/modules/contacts/schema'
import { createOwnershipAction } from '@/modules/contacts/server/contact-actions'

export function OwnershipForm({ unitId, owners }: { unitId: string, owners: {id: string, fullName: string}[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<OwnershipInput>({
    resolver: zodResolver(ownershipSchema),
    defaultValues: {
      unitId,
      ownerId: '',
      ownershipPercent: 100,
      isPrimaryBillingContact: true,
    },
  })

  function onSubmit(data: OwnershipInput) {
    startTransition(async () => {
      const result = await createOwnershipAction(data)
      if (result.success) {
        toast.success('Titularidad registrada')
        router.refresh()
        form.reset({
          unitId,
          ownerId: '',
          ownershipPercent: 100,
          isPrimaryBillingContact: false,
        })
      } else {
        toast.error('Error', { description: result.error || 'No se pudo asignar el propietario.' })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Propietario *</label>
          <select
            {...form.register('ownerId')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecciona un propietario...</option>
            {owners.map(o => (
              <option key={o.id} value={o.id}>{o.fullName}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Porcentaje Titularidad (%) *</label>
          <input
            {...form.register('ownershipPercent', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        
        <div className="space-y-2 flex items-center gap-2 mt-8 sm:col-span-2">
          <input type="checkbox" id="primaryBilling" {...form.register('isPrimaryBillingContact')} />
          <label htmlFor="primaryBilling" className="text-sm font-medium">
            Representante principal para facturación de esta unidad
          </label>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {isPending ? 'Registrando...' : 'Añadir Titular'}
      </button>
    </form>
  )
}
