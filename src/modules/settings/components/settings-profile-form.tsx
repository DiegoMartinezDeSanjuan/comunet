'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { updateOfficeProfileAction } from '@/modules/settings/server/actions'
import type { Office } from '@prisma/client'

const updateOfficeSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  nif: z.string().min(5, 'El NIF es requerido'),
  email: z.string().email('Email no válido'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

type FormData = z.infer<typeof updateOfficeSchema>

export function SettingsProfileForm({ office, canEdit }: { office: Office; canEdit: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(updateOfficeSchema),
    defaultValues: {
      name: office.name,
      nif: office.nif,
      email: office.email,
      phone: office.phone || '',
      address: office.address || '',
    },
  })

  function onSubmit(data: FormData) {
    if (!canEdit) return

    startTransition(async () => {
      try {
        await updateOfficeProfileAction({
          name: data.name,
          nif: data.nif,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
        })

        toast({
          title: 'Perfil actualizado',
          description: 'Los datos del despacho han sido guardados.',
        })
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo actualizar',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre del Despacho</label>
          <Input 
            {...form.register('name')} 
            disabled={!canEdit || isPending}
            className="bg-background"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">CIF/NIF</label>
          <Input 
            {...form.register('nif')} 
            disabled={!canEdit || isPending}
            className="bg-background"
          />
          {form.formState.errors.nif && (
            <p className="text-sm text-red-500">{form.formState.errors.nif.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email de Contacto</label>
          <Input 
            {...form.register('email')} 
            type="email"
            disabled={!canEdit || isPending}
            className="bg-background"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Teléfono</label>
          <Input 
            {...form.register('phone')} 
            disabled={!canEdit || isPending}
            className="bg-background"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Dirección Fiscal / Postal</label>
          <Input 
            {...form.register('address')} 
            disabled={!canEdit || isPending}
            className="bg-background"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button 
          type="submit" 
          disabled={!canEdit || isPending || !form.formState.isDirty}
        >
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  )
}
