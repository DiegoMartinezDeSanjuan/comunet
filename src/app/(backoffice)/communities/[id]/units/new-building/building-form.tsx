'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { buildingSchema, type BuildingInput } from '@/modules/units/schema'
import { createBuildingAction } from '@/modules/units/server/unit-actions'

export function BuildingForm({ communityId }: { communityId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<BuildingInput>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      communityId,
      name: '',
    },
  })

  function onSubmit(data: BuildingInput) {
    startTransition(async () => {
      const result = await createBuildingAction(data)
      if (result.success) {
        toast.success('Edificio creado')
        router.push(`/communities/${communityId}/units`)
      } else {
        toast.error('Error', { description: result.error || 'No se pudo guardar el edificio.' })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre del Edificio / Portal *</label>
        <input
          {...form.register('name')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Ej: Bloque A, Portal 1..."
          autoFocus
        />
        {form.formState.errors.name && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {isPending ? 'Guardando...' : 'Crear Edificio'}
        </button>
      </div>
    </form>
  )
}
