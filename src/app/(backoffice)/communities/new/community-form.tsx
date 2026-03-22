'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { communitySchema, type CommunityInput } from '@/modules/communities/schema'
import { createCommunityAction, updateCommunityAction } from '@/modules/communities/server/community-actions'

interface Props {
  initialData?: Partial<CommunityInput> & { id?: string }
}

export function CommunityForm({ initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CommunityInput>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: initialData?.name || '',
      cif: initialData?.cif || '',
      address: initialData?.address || '',
      iban: initialData?.iban || '',
      fiscalYear: initialData?.fiscalYear || new Date().getFullYear(),
      notes: initialData?.notes || '',
    },
  })

  function onSubmit(data: CommunityInput) {
    startTransition(async () => {
      const result = initialData?.id
        ? await updateCommunityAction(initialData.id, data)
        : await createCommunityAction(data)
        
      if (result.success && result.data) {
        toast.success(initialData?.id ? 'Comunidad actualizada' : 'Comunidad creada', { 
          description: 'La comunidad se ha guardado correctamente.' 
        })
        router.push(`/communities/${result.data.id}`)
      } else {
        toast.error('Error', { description: result.error || 'No se pudo guardar la comunidad.' })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Nombre de la Comunidad *
          </label>
          <input
            {...form.register('name')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ej: Edificio Los Pinos"
          />
          {form.formState.errors.name && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            CIF / NIF
          </label>
          <input
            {...form.register('cif')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Ej: H12345678"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium leading-none">
            Dirección
          </label>
          <input
            {...form.register('address')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Calle, número, localidad..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Cuenta Bancaria (IBAN)
          </label>
          <input
            {...form.register('iban')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="ES91..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Año Fiscal Activo
          </label>
          <input
            type="number"
            {...form.register('fiscalYear', { valueAsNumber: true })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium leading-none">
            Notas adicionales
          </label>
          <textarea
            {...form.register('notes')}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : initialData?.id ? 'Actualizar Comunidad' : 'Guardar Comunidad'}
        </button>
      </div>
    </form>
  )
}
