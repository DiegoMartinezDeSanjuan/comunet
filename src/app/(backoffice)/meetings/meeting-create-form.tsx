'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { createMeetingAction } from '@/modules/meetings/server/actions'
import { CalendarPlus, ChevronDown } from 'lucide-react'

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
  const [isOpen, setIsOpen] = useState(false)

  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [meetingType, setMeetingType] = useState<'ORDINARY' | 'EXTRAORDINARY'>('ORDINARY')
  const [scheduledAt, setScheduledAt] = useState(getDefaultScheduledAt)
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

  const selectClass = "w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"

  return (
    <section className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <CalendarPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Nueva reunión</h2>
            <p className="text-xs text-muted-foreground">
              Crea convocatorias desde backoffice con comunidad, fecha, tipo y estado inicial.
            </p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Collapsible Body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border/30 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Junta ordinaria de primavera"
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Comunidad</label>
              <select
                className={selectClass}
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo de reunión</label>
              <select
                className={selectClass}
                value={meetingType}
                onChange={(event) => setMeetingType(event.target.value as 'ORDINARY' | 'EXTRAORDINARY')}
              >
                <option value="ORDINARY">Ordinaria</option>
                <option value="EXTRAORDINARY">Extraordinaria</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fecha y hora</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Estado inicial</label>
              <select
                className={selectClass}
                value={status}
                onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'SCHEDULED')}
              >
                <option value="DRAFT">Borrador</option>
                <option value="SCHEDULED">Programada</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ubicación</label>
              <Input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ej. Sala social, despacho o videollamada"
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descripción</label>
              <Textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contexto, motivos de convocatoria y notas previas."
                className="rounded-xl border-border/50 bg-card/50"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              data-testid="meeting-create-submit"
              onClick={handleSubmit}
              disabled={isPending || !communityId || title.trim().length < 3 || !scheduledAt}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110"
            >
              {isPending ? 'Guardando...' : 'Crear reunión'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
