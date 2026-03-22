'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { tenantSchema, type TenantInput } from '@/modules/contacts/schema'
import { createTenantAction, updateTenantAction } from '@/modules/contacts/server/contact-actions'

interface Props {
  initialData?: Partial<TenantInput> & { id?: string }
}

export function TenantForm({ initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<TenantInput>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      dni: initialData?.dni || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      notes: initialData?.notes || '',
    },
  })

  function onSubmit(data: TenantInput) {
    startTransition(async () => {
      const result = initialData?.id
        ? await updateTenantAction(initialData.id, data)
        : await createTenantAction(data)
        
      if (result.success) {
        toast.success(initialData?.id ? 'Inquilino actualizado' : 'Inquilino creado')
        router.push(`/tenants`)
      } else {
        toast.error('Error', { description: result.error || 'No se pudo guardar el inquilino.' })
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
          {isPending ? 'Guardando...' : initialData?.id ? 'Actualizar Inquilino' : 'Guardar Inquilino'}
        </button>
      </div>
    </form>
  )
}
