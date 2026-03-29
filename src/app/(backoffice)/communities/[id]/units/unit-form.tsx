'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { unitSchema, type UnitInput } from '@/modules/units/schema'
import { createUnitAction, updateUnitAction } from '@/modules/units/server/unit-actions'

interface Props {
  communityId: string
  buildings: { id: string; name: string }[]
  initialData?: Partial<UnitInput> & { id?: string }
}

export function UnitForm({ communityId, buildings, initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      communityId,
      buildingId: initialData?.buildingId || null,
      reference: initialData?.reference || '',
      type: initialData?.type || 'APARTMENT',
      floor: initialData?.floor || '',
      door: initialData?.door || '',
      areaM2: initialData?.areaM2 || null,
      coefficient: initialData?.coefficient || null,
      quotaPercent: initialData?.quotaPercent || null,
      active: initialData?.active ?? true,
    },
  })

  function onSubmit(data: UnitInput) {
    startTransition(async () => {
      const result = initialData?.id
        ? await updateUnitAction(initialData.id, data)
        : await createUnitAction(data)
        
      if (result.success) {
        toast.success(initialData?.id ? 'Unidad actualizada' : 'Unidad creada')
        router.push(`/communities/${communityId}/units`)
      } else {
        toast.error('Error', { description: result.error || 'No se pudo guardar la unidad.' })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Referencia / Identificador *</label>
          <input
            {...form.register('reference')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Ej: 1A, Local 2, Plaza 14..."
          />
          {form.formState.errors.reference && (
            <p className="text-xs text-red-400">{form.formState.errors.reference.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Edificio</label>
          <select
            {...form.register('buildingId')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">(Sin edificio / Principal)</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <select
            {...form.register('type')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="APARTMENT">Vivienda</option>
            <option value="GARAGE">Plaza de Garaje</option>
            <option value="STORAGE">Trastero</option>
            <option value="COMMERCIAL">Local Comercial</option>
            <option value="OTHER">Otro</option>
          </select>
          {form.formState.errors.type && (
            <p className="text-xs text-red-400">{form.formState.errors.type.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Planta</label>
            <input {...form.register('floor')} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Puerta</label>
            <input {...form.register('door')} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Coeficiente de Participación (%)</label>
          <input
            type="number"
            step="0.01"
            {...form.register('coefficient', { setValueAs: (v) => v === '' || v === null || v === undefined ? null : Number(v) })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Superficie (m2)</label>
          <input
            type="number"
            step="0.01"
            {...form.register('areaM2', { setValueAs: (v) => v === '' || v === null || v === undefined ? null : Number(v) })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        
        <div className="space-y-2 sm:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="active" {...form.register('active')} />
          <label htmlFor="active" className="text-sm font-medium">Unidad activa (desmarcar para dar de baja sin borrar historial)</label>
        </div>
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
          {isPending ? 'Guardando...' : 'Guardar Unidad'}
        </button>
      </div>
    </form>
  )
}
