'use client'

import { useEffect, useState, useTransition } from 'react'
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

function getDefaultScheduledAt(): string {
  const value = new Date()
  value.setDate(value.getDate() + 7)
  return toDateTimeLocal(value)
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
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('SCHEDULED')

  useEffect(() => {
    setScheduledAt((current) => current || getDefaultScheduledAt())
  }, [])

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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Nueva reunión</h2>
          <p className="mt-1 text-sm text-slate-600">
            Crea convocatorias desde backoffice con comunidad, fecha, tipo y estado inicial.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Junta ordinaria de primavera"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Comunidad</label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de reunión</label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={meetingType}
            onChange={(event) => setMeetingType(event.target.value as 'ORDINARY' | 'EXTRAORDINARY')}
          >
            <option value="ORDINARY">ORDINARY</option>
            <option value="EXTRAORDINARY">EXTRAORDINARY</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fecha y hora</label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Estado inicial</label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'SCHEDULED')}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SCHEDULED">SCHEDULED</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Ubicación</label>
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Ej. Sala social, despacho o videollamada"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <Textarea
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
