'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, EditIcon, KeyRoundIcon, AlertTriangleIcon } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserRole, UserStatus } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { createUser, updateUser, archiveUser, resetUserPassword } from '@/modules/users/server/actions'

const userFormSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email no válido'),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  linkedOwnerId: z.string().optional(),
  linkedProviderId: z.string().optional(),
})

type FormData = z.infer<typeof userFormSchema>

export function CreateUserDialog() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'VIEWER',
      status: 'ACTIVE',
      linkedOwnerId: '',
      linkedProviderId: '',
    },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const payload = {
          ...data,
          linkedOwnerId: data.linkedOwnerId || null,
          linkedProviderId: data.linkedProviderId || null,
        }
        const result = await createUser(payload)
        setTempPassword(result.temporaryPassword)
        
        toast({
          title: 'Usuario creado',
          description: 'El usuario se ha creado correctamente.',
        })
        form.reset()
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error al crear usuario',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        })
      }
    })
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setTempPassword(null)
      form.reset()
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {tempPassword ? (
          <div className="space-y-4">
             <DialogHeader>
              <DialogTitle>Contraseña Temporal Generada</DialogTitle>
              <DialogDescription className="text-amber-600 dark:text-amber-500 font-medium">
                Por favor, guarda esta contraseña. No volverá a mostrarse.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-md text-center">
              <span className="text-2xl font-mono font-bold tracking-widest select-all">{tempPassword}</span>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Añadir Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo acceso. Puedes vincularlo a un propietario o proveedor existente mediante su ID.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Nombre Completo</label>
              <Input {...form.register('name')} placeholder="Juan Pérez" disabled={isPending} />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Email (Login)</label>
              <Input {...form.register('email')} type="email" placeholder="usuario@ejemplo.com" disabled={isPending} />
              {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <select {...form.register('role')} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending}>
                <option value="VIEWER">Invitado (Viewer)</option>
                <option value="ACCOUNTANT">Contable (Accountant)</option>
                <option value="MANAGER">Gestor (Manager)</option>
                <option value="OFFICE_ADMIN">Administrador (Office Admin)</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="OWNER">Propietario / Inquilino</option>
                <option value="PRESIDENT">Presidente</option>
                <option value="PROVIDER">Proveedor</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado Inicial</label>
              <select {...form.register('status')} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Propietario (Opcional)</label>
              <Input {...form.register('linkedOwnerId')} placeholder="cuid..." disabled={isPending} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Proveedor (Opcional)</label>
              <Input {...form.register('linkedProviderId')} placeholder="cuid..." disabled={isPending} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>Crear Usuario</Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function EditUserDialog({ user, currentUserId }: { user: any, currentUserId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      linkedOwnerId: user.linkedOwnerId || '',
      linkedProviderId: user.linkedProviderId || '',
    },
  })

  const isSelf = user.id === currentUserId

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const payload = {
          ...data,
          linkedOwnerId: data.linkedOwnerId || null,
          linkedProviderId: data.linkedProviderId || null,
        }
        await updateUser(user.id, payload)
        
        toast({
          title: 'Usuario actualizado',
          description: 'Los cambios se han guardado correctamente.',
        })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error de actualización',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        })
      }
    })
  }

  function handleArchive() {
    if (!confirm('¿Seguro que quieres archivar este usuario? Perderá el acceso de inmediato.')) return
    
    startTransition(async () => {
      try {
        await archiveUser(user.id)
        toast({
          title: 'Usuario archivado',
        })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error al archivar',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <EditIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos operativos de {user.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Nombre Completo</label>
              <Input {...form.register('name')} disabled={isPending} />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Email (Login)</label>
              <Input {...form.register('email')} type="email" disabled={isPending} />
              {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <select {...form.register('role')} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending}>
                <option value="VIEWER">Invitado (Viewer)</option>
                <option value="ACCOUNTANT">Contable (Accountant)</option>
                <option value="MANAGER">Gestor (Manager)</option>
                <option value="OFFICE_ADMIN">Administrador (Office Admin)</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="OWNER">Propietario / Inquilino</option>
                <option value="PRESIDENT">Presidente</option>
                <option value="PROVIDER">Proveedor</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <select {...form.register('status')} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending || isSelf}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="SUSPENDED">Suspendido</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Propietario (Opcional)</label>
              <Input {...form.register('linkedOwnerId')} placeholder="cuid..." disabled={isPending} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Proveedor (Opcional)</label>
              <Input {...form.register('linkedProviderId')} placeholder="cuid..." disabled={isPending} />
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center w-full mt-4">
            <Button type="button" variant="destructive" size="sm" onClick={handleArchive} disabled={isSelf || isPending}>
              Archivar
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>Guardar</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ResetPasswordDialog({ userId, userName }: { userId: string, userName: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  function handleReset() {
    startTransition(async () => {
      try {
        const result = await resetUserPassword(userId)
        setTempPassword(result.temporaryPassword)
      } catch (error) {
        toast({
          title: 'Error al resetear',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        })
        setOpen(false)
      }
    })
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setTempPassword(null)
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Resetear Contraseña">
          <KeyRoundIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        {tempPassword ? (
           <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Módulo de Seguridad</DialogTitle>
              <DialogDescription className="text-amber-600 dark:text-amber-500 font-medium">
                Se ha generado la contraseña temporal para {userName}.
              </DialogDescription>
            </DialogHeader>
             <div className="p-4 bg-muted rounded-md text-center">
               <span className="text-2xl font-mono font-bold tracking-widest select-all">{tempPassword}</span>
             </div>
             <p className="text-sm text-muted-foreground text-center">
               Copia la contraseña y envíasela por un canal seguro de manera manual.
             </p>
             <DialogFooter>
               <Button onClick={() => handleClose(false)}>Entendido</Button>
             </DialogFooter>
           </div>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Resetear Contraseña</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de resetear la contraseña de <strong>{userName}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 border p-3 rounded-md flex items-start gap-3 text-amber-800 dark:text-amber-300">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm text-balance leading-relaxed">
                Esta acción es irreversible y el acceso actual con su contraseña vinculada dejará de funcionar inmediatamente.
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isPending}>Cancelar</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleReset} disabled={isPending}>
                {isPending ? 'Reseteando...' : 'Resetear Contraseña'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
