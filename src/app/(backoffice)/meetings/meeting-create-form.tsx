'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { createMeetingAction } from '@/modules/meetings/server/actions'

type CommunityOption = {
  id: string
  name: string
}

type MeetingCreateFormProps = {
  communities: CommunityOption[]
}

function toDateTimeLocal(value: Date): string {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
  return adjusted.toISOString().slice(0, 16)
}

function toIsoDateTime(value: string): string {
  return new Date(value).toISOString()
}

export function MeetingCreateForm({ communities }: MeetingCreateFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [meetingType, setMeetingType] = useState<'ORDINARY' | 'EXTRAORDINARY'>('ORDINARY')
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)))
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('SCHEDULED')

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const created = await createMeetingAction({
          communityId,
          title,
          meetingType,
          scheduledAt: toIsoDateTime(scheduledAt),
          location: location.trim() || null,
          description: description.trim() || null,
          status,
        })

        toast({
          title: 'Reunión creada',
          description: 'La reunión se ha registrado correctamente.',
        })
        router.push(`/meetings/${created.id}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo crear la reunión.'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm" data-testid="meeting-create-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Nueva reunión</h2>
        <p className="text-sm text-muted-foreground">
          Crea convocatorias desde backoffice con comunidad, fecha, tipo y estado inicial.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="meeting-create-title" className="text-sm font-medium">
            Título
          </label>
          <Input
            id="meeting-create-title"
            data-testid="meeting-create-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Junta ordinaria de primavera"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="meeting-create-community" className="text-sm font-medium">
            Comunidad
          </label>
          <select
            id="meeting-create-community"
            data-testid="meeting-create-community"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={communityId}
            onChange={(event) => setCommunityId(event.target.value)}
          >
            <option value="">Selecciona una comunidad</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="meeting-create-type" className="text-sm font-medium">
            Tipo de reunión
          </label>
          <select
            id="meeting-create-type"
            data-testid="meeting-create-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={meetingType}
            onChange={(event) => setMeetingType(event.target.value as 'ORDINARY' | 'EXTRAORDINARY')}
          >
            <option value="ORDINARY">ORDINARY</option>
            <option value="EXTRAORDINARY">EXTRAORDINARY</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="meeting-create-scheduled-at" className="text-sm font-medium">
            Fecha y hora
          </label>
          <Input
            id="meeting-create-scheduled-at"
            data-testid="meeting-create-scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="meeting-create-status" className="text-sm font-medium">
            Estado inicial
          </label>
          <select
            id="meeting-create-status"
            data-testid="meeting-create-status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'SCHEDULED')}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SCHEDULED">SCHEDULED</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="meeting-create-location" className="text-sm font-medium">
            Ubicación
          </label>
          <Input
            id="meeting-create-location"
            data-testid="meeting-create-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Ej. Sala social, despacho o videollamada"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="meeting-create-description" className="text-sm font-medium">
            Descripción
          </label>
          <Textarea
            id="meeting-create-description"
            data-testid="meeting-create-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contexto, motivos de convocatoria y notas previas."
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          data-testid="meeting-create-submit"
          onClick={handleSubmit}
          disabled={isPending || !communityId || title.trim().length < 3 || !scheduledAt}
        >
          {isPending ? 'Guardando...' : 'Crear reunión'}
        </Button>
      </div>
    </section>
  )
}
