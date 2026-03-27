'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  addAgendaItemAction,
  changeMeetingStatusAction,
  saveMeetingMinuteAction,
  updateMeetingAction,
  generateMinuteDraftAction,
} from '@/modules/meetings/server/actions'

type MeetingStatus = 'DRAFT' | 'SCHEDULED' | 'HELD' | 'CLOSED'
type MeetingType = 'ORDINARY' | 'EXTRAORDINARY'
type MinuteStatus = 'DRAFT' | 'GENERATED' | 'APPROVED'

type MeetingDetailActionsProps = {
  meeting: {
    id: string
    title: string
    meetingType: MeetingType
    scheduledAt: string
    location: string
    description: string
    status: MeetingStatus
  }
  latestMinute: {
    id: string
    content: string
    status: MinuteStatus
  } | null
}

function toIsoDateTime(value: string): string {
  return new Date(value).toISOString()
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value)
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return adjusted.toISOString().slice(0, 16)
}

export function MeetingDetailActions({ meeting, latestMinute }: MeetingDetailActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(meeting.title)
  const [meetingType, setMeetingType] = useState<MeetingType>(meeting.meetingType)
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(meeting.scheduledAt))
  const [location, setLocation] = useState(meeting.location)
  const [description, setDescription] = useState(meeting.description)
  const [status, setStatus] = useState<MeetingStatus>(meeting.status)

  const [agendaTitle, setAgendaTitle] = useState('')
  const [agendaDescription, setAgendaDescription] = useState('')

  const [minuteContent, setMinuteContent] = useState(latestMinute?.content ?? '')
  const [minuteStatus, setMinuteStatus] = useState<MinuteStatus>(latestMinute?.status ?? 'DRAFT')

  const isClosed = meeting.status === 'CLOSED'

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'No se pudo completar la acción.'
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    })
  }

  const handleUpdateMeeting = () => {
    startTransition(async () => {
      try {
        await updateMeetingAction(meeting.id, {
          title,
          meetingType,
          scheduledAt: toIsoDateTime(scheduledAt),
          location: location.trim() || null,
          description: description.trim() || null,
        })
        toast({
          title: 'Reunión actualizada',
          description: 'Los datos generales se han guardado correctamente.',
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
        await changeMeetingStatusAction({ meetingId: meeting.id, status })
        toast({
          title: 'Estado actualizado',
          description: 'La reunión ha cambiado de estado.',
        })
        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  const handleAddAgendaItem = () => {
    startTransition(async () => {
      try {
        await addAgendaItemAction({
          meetingId: meeting.id,
          title: agendaTitle,
          description: agendaDescription.trim() || null,
        })
        setAgendaTitle('')
        setAgendaDescription('')
        toast({
          title: 'Punto añadido',
          description: 'El orden del día se ha actualizado.',
        })
        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  const handleSaveMinute = () => {
    startTransition(async () => {
      try {
        await saveMeetingMinuteAction({
          meetingId: meeting.id,
          content: minuteContent,
          status: minuteStatus,
        })
        toast({
          title: 'Acta guardada',
          description: 'El borrador del acta se ha actualizado.',
        })
        router.refresh()
      } catch (error) {
        handleError(error)
      }
    })
  }

  const handleGenerateMinute = () => {
    if (!confirm('¿Atención! Esto sobreescribirá el contenido actual del acta. ¿Deseas continuar?')) return
    startTransition(async () => {
      try {
        const generated = await generateMinuteDraftAction({ meetingId: meeting.id })
        setMinuteContent(generated.content)
        toast({
          title: 'Borrador generado',
          description: 'Puedes modificar el texto antes de guardarlo.',
        })
      } catch (error) {
        handleError(error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="meeting-edit-card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Editar reunión</h2>
          <p className="text-sm text-muted-foreground">
            Ajusta convocatoria, tipo, fecha y ubicación. Las reuniones cerradas quedan bloqueadas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="meeting-edit-title" className="text-sm font-medium">
              Título
            </label>
            <Input
              id="meeting-edit-title"
              data-testid="meeting-edit-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting-edit-type" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="meeting-edit-type"
              data-testid="meeting-edit-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={meetingType}
              onChange={(event) => setMeetingType(event.target.value as MeetingType)}
              disabled={isPending || isClosed}
            >
              <option value="ORDINARY">ORDINARY</option>
              <option value="EXTRAORDINARY">EXTRAORDINARY</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting-edit-status" className="text-sm font-medium">
              Estado
            </label>
            <select
              id="meeting-edit-status"
              data-testid="meeting-edit-status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value as MeetingStatus)}
              disabled={isPending}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="HELD">HELD</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting-edit-scheduled-at" className="text-sm font-medium">
              Fecha y hora
            </label>
            <Input
              id="meeting-edit-scheduled-at"
              data-testid="meeting-edit-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting-edit-location" className="text-sm font-medium">
              Ubicación
            </label>
            <Input
              id="meeting-edit-location"
              data-testid="meeting-edit-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="meeting-edit-description" className="text-sm font-medium">
              Descripción
            </label>
            <Textarea
              id="meeting-edit-description"
              data-testid="meeting-edit-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            data-testid="meeting-edit-submit"
            onClick={handleUpdateMeeting}
            disabled={isPending || isClosed || title.trim().length < 3}
          >
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="meeting-status-submit"
            onClick={handleChangeStatus}
            disabled={isPending}
          >
            {isPending ? 'Actualizando...' : 'Cambiar estado'}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="meeting-agenda-card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Orden del día</h2>
          <p className="text-sm text-muted-foreground">
            Añade puntos para preparar la junta y dejar trazabilidad del contenido.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="meeting-agenda-title" className="text-sm font-medium">
              Título del punto
            </label>
            <Input
              id="meeting-agenda-title"
              data-testid="meeting-agenda-title"
              value={agendaTitle}
              onChange={(event) => setAgendaTitle(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting-agenda-description" className="text-sm font-medium">
              Descripción
            </label>
            <Textarea
              id="meeting-agenda-description"
              data-testid="meeting-agenda-description"
              rows={3}
              value={agendaDescription}
              onChange={(event) => setAgendaDescription(event.target.value)}
              disabled={isPending || isClosed}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            data-testid="meeting-agenda-submit"
            onClick={handleAddAgendaItem}
            disabled={isPending || isClosed || agendaTitle.trim().length < 3}
          >
            {isPending ? 'Guardando...' : 'Añadir punto'}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="meeting-minute-card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Acta / Minuta</h2>
          <p className="text-sm text-muted-foreground">
            Guarda un borrador del acta y marca su estado cuando la reunión haya sido celebrada.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="meeting-minute-status" className="text-sm font-medium">
              Estado del acta
            </label>
            <select
              id="meeting-minute-status"
              data-testid="meeting-minute-status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={minuteStatus}
              onChange={(event) => setMinuteStatus(event.target.value as MinuteStatus)}
              disabled={isPending}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="GENERATED">GENERATED</option>
              <option value="APPROVED">APPROVED</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting-minute-content" className="text-sm font-medium">
              Contenido
            </label>
            <Textarea
              id="meeting-minute-content"
              data-testid="meeting-minute-content"
              rows={10}
              value={minuteContent}
              onChange={(event) => setMinuteContent(event.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="meeting-minute-generate"
            onClick={handleGenerateMinute}
            disabled={isPending}
          >
            {isPending ? 'Cargando...' : 'Generar borrador automático'}
          </Button>
          <Button
            type="button"
            data-testid="meeting-minute-submit"
            onClick={handleSaveMinute}
            disabled={isPending || minuteContent.trim().length < 3}
          >
            {isPending ? 'Guardando...' : 'Guardar acta'}
          </Button>
        </div>
      </section>
    </div>
  )
}
