'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { boardPositionSchema, type BoardPositionInput } from '@/modules/contacts/schema'
import { createBoardPositionAction } from '@/modules/contacts/server/contact-actions'

export function BoardPositionForm({ communityId, owners }: { communityId: string, owners: {id: string, fullName: string}[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<BoardPositionInput>({
    resolver: zodResolver(boardPositionSchema),
    defaultValues: {
      communityId,
      ownerId: '',
      role: 'VOCAL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  })

  function onSubmit(data: BoardPositionInput) {
    startTransition(async () => {
      const result = await createBoardPositionAction(data, communityId)
      if (result.success) {
        toast.success('Cargo asignado')
        router.refresh()
        form.reset({
          communityId,
          ownerId: '',
          role: 'VOCAL',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
        })
      } else {
        toast.error('Error', { description: result.error || 'No se pudo asignar el cargo.' })
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
          <label className="text-sm font-medium">Cargo *</label>
          <select
            {...form.register('role')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="PRESIDENT">Presidente</option>
            <option value="VICE_PRESIDENT">Vicepresidente</option>
            <option value="SECRETARY">Secretario / Administrador</option>
            <option value="VOCAL">Vocal</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha de Nombramiento</label>
          <input
            {...form.register('startDate')}
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha de Cese (Opcional)</label>
          <input
            {...form.register('endDate')}
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {isPending ? 'Asignando...' : 'Asignar Cargo'}
      </button>
    </form>
  )
}
