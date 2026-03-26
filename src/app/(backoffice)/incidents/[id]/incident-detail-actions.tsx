'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  addIncidentCommentAction,
  assignProviderToIncidentAction,
  changeIncidentStatusAction,
  updateIncidentAction,
} from '@/modules/incidents/server/actions'

type ProviderOption = {
  id: string
  name: string
  category: string | null
}

type IncidentDetailActionsProps = {
  incident: {
    id: string
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    status:
      | 'OPEN'
      | 'ASSIGNED'
      | 'IN_PROGRESS'
      | 'WAITING_VENDOR'
      | 'RESOLVED'
      | 'CLOSED'
    dueAt: string
    assignedProviderId: string
  }
  providerOptions: ProviderOption[]
}

function toIsoDateTime(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

export function IncidentDetailActions({
  incident,
  providerOptions,
}: IncidentDetailActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(incident.title)
  const [description, setDescription] = useState(incident.description)
  const [priority, setPriority] = useState(incident.priority)
  const [dueAt, setDueAt] = useState(incident.dueAt)
  const [providerId, setProviderId] = useState(incident.assignedProviderId)
  const [status, setStatus] = useState(incident.status)
  const [commentBody, setCommentBody] = useState('')
  const [commentVisibility, setCommentVisibility] = useState<'INTERNAL' | 'SHARED'>('INTERNAL')

  const isClosed = incident.status === 'CLOSED'

  const handleError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'No se pudo completar la accion.'

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    })
  }

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        await updateIncidentAction(incident.id, {
          title,
          description: description.trim() ? description.trim() : null,
          priority,
          dueAt: dueAt ? toIsoDateTime(dueAt) : null,
        })

        toast({
          title: 'Incidencia actualizada',
          description: 'Los datos generales se han guardado.',
        })

        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  const handleAssignProvider = () => {
    if (!providerId) {
      toast({
        title: 'Selecciona un proveedor',
        description: 'Debes elegir un proveedor activo para asignarlo.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      try {
        await assignProviderToIncidentAction({
          incidentId: incident.id,
          providerId,
        })

        toast({
          title: 'Proveedor asignado',
          description: 'La incidencia se ha actualizado correctamente.',
        })

        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  const handleChangeStatus = () => {
    startTransition(async () => {
      try {
        await changeIncidentStatusAction({
          incidentId: incident.id,
          status,
        })

        toast({
          title: 'Estado actualizado',
          description: 'La traza de la incidencia se ha actualizado.',
        })

        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  const handleAddComment = () => {
    startTransition(async () => {
      try {
        await addIncidentCommentAction({
          incidentId: incident.id,
          body: commentBody,
          visibility: commentVisibility,
        })

        setCommentBody('')

        toast({
          title: 'Comentario registrado',
          description: 'El comentario se ha anadido a la incidencia.',
        })

        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Editar incidencia</h2>
          <p className="text-sm text-muted-foreground">
            Ajusta el contenido operativo de la incidencia. Las incidencias
            cerradas quedan bloqueadas para cambios generales.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Titulo</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Descripcion</label>
            <Textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridad</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                )
              }
              disabled={isPending || isClosed}
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vencimiento</label>
            <Input
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleUpdate}
            disabled={isPending || isClosed || title.trim().length < 3}
          >
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Asignacion y seguimiento</h2>
          <p className="text-sm text-muted-foreground">
            Cambia proveedor o estado sin saltarte las reglas del dominio.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Proveedor</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={providerId}
              onChange={(event) => setProviderId(event.target.value)}
              disabled={isPending || isClosed}
            >
              <option value="">Selecciona un proveedor</option>
              {providerOptions.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                  {provider.category ? ` · ${provider.category}` : ''}
                </option>
              ))}
            </select>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAssignProvider}
                disabled={isPending || isClosed || !providerId}
              >
                {isPending ? 'Guardando...' : 'Asignar proveedor'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | 'OPEN'
                    | 'ASSIGNED'
                    | 'IN_PROGRESS'
                    | 'WAITING_VENDOR'
                    | 'RESOLVED'
                    | 'CLOSED',
                )
              }
              disabled={isPending || isClosed}
            >
              <option value="OPEN">OPEN</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="WAITING_VENDOR">WAITING_VENDOR</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleChangeStatus}
                disabled={isPending || isClosed}
              >
                {isPending ? 'Guardando...' : 'Cambiar estado'}
              </Button>
            </div>
          </div>
        </div>

        {isClosed ? (
          <p className="mt-4 text-sm text-muted-foreground">
            La incidencia esta cerrada y no admite mas cambios operativos.
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Nuevo comentario</h2>
          <p className="text-sm text-muted-foreground">
            Usa INTERNAL para backoffice y SHARED para preparar futura
            reutilizacion en portales y notificaciones.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Comentario</label>
            <Textarea
              rows={4}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Anade contexto, seguimiento o instrucciones."
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibilidad</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={commentVisibility}
              onChange={(event) =>
                setCommentVisibility(
                  event.target.value as 'INTERNAL' | 'SHARED',
                )
              }
              disabled={isPending}
            >
              <option value="INTERNAL">INTERNAL</option>
              <option value="SHARED">SHARED</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleAddComment}
            disabled={isPending || commentBody.trim().length === 0}
          >
            {isPending ? 'Guardando...' : 'Anadir comentario'}
          </Button>
        </div>
      </section>
    </div>
  )
}
