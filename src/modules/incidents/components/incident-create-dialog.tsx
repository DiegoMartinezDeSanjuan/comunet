'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { createIncidentAction } from '@/modules/incidents/server/actions'

type UnitOption = { id: string; reference: string }
type CommunityOption = { id: string; name: string; units: UnitOption[] }
type ProviderOption = { id: string; name: string; category: string | null }

interface IncidentCreateDialogProps {
  communities: CommunityOption[]
  providers: ProviderOption[]
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

export function IncidentCreateDialog({
  communities,
  providers,
}: IncidentCreateDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '')
  const [unitId, setUnitId] = useState('')
  const [assignedProviderId, setAssignedProviderId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [reportedAt, setReportedAt] = useState(today)
  const [dueAt, setDueAt] = useState('')

  const availableUnits = useMemo(() => {
    return communities.find((c) => c.id === communityId)?.units ?? []
  }, [communities, communityId])

  const resetForm = () => {
    setCommunityId(communities[0]?.id ?? '')
    setUnitId('')
    setAssignedProviderId('')
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setReportedAt(today)
    setDueAt('')
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const created = await createIncidentAction({
          communityId,
          unitId: unitId || null,
          assignedProviderId: assignedProviderId || null,
          title,
          description: description.trim() ? description.trim() : null,
          priority,
          reportedAt: reportedAt ? toIsoDateTime(reportedAt) : undefined,
          dueAt: dueAt ? toIsoDateTime(dueAt) ?? null : null,
        })

        toast({
          title: 'Incidencia creada',
          description: 'La incidencia se ha registrado correctamente.',
        })

        setOpen(false)
        resetForm()
        router.push(`/incidents/${created.id}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo crear la incidencia.'
        toast({ title: 'Error', description: message, variant: 'destructive' })
      }
    })
  }

  const selectClass = 'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:brightness-110"
          data-testid="incident-create-trigger"
        >
          <Plus className="h-4 w-4" />
          Nueva incidencia
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva incidencia</DialogTitle>
          <DialogDescription>
            Alta manual desde backoffice con comunidad, unidad opcional, prioridad y asignación inicial.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 py-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="incident-create-title" className="text-sm font-medium">Título</label>
            <Input
              id="incident-create-title"
              data-testid="incident-create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Fuga en bajante del portal B"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="incident-create-description" className="text-sm font-medium">Descripción</label>
            <Textarea
              id="incident-create-description"
              data-testid="incident-create-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema, ubicación y contexto relevante."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-create-community" className="text-sm font-medium">Comunidad</label>
            <select
              id="incident-create-community"
              data-testid="incident-create-community"
              className={selectClass}
              value={communityId}
              onChange={(e) => { setCommunityId(e.target.value); setUnitId('') }}
            >
              <option value="">Selecciona una comunidad</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-create-unit" className="text-sm font-medium">Unidad (opcional)</label>
            <select
              id="incident-create-unit"
              data-testid="incident-create-unit"
              className={selectClass}
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              disabled={!communityId}
            >
              <option value="">Sin unidad</option>
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.reference}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-create-provider" className="text-sm font-medium">Proveedor</label>
            <select
              id="incident-create-provider"
              data-testid="incident-create-provider"
              className={selectClass}
              value={assignedProviderId}
              onChange={(e) => setAssignedProviderId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.category ? ` · ${p.category}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-create-priority" className="text-sm font-medium">Prioridad</label>
            <select
              id="incident-create-priority"
              data-testid="incident-create-priority"
              className={selectClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-create-reported-at" className="text-sm font-medium">Reportada el</label>
            <Input
              id="incident-create-reported-at"
              data-testid="incident-create-reported-at"
              type="date"
              value={reportedAt}
              onChange={(e) => setReportedAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-create-due-at" className="text-sm font-medium">Vencimiento</label>
            <Input
              id="incident-create-due-at"
              data-testid="incident-create-due-at"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            data-testid="incident-create-submit"
            onClick={handleSubmit}
            disabled={isPending || !communityId || title.trim().length < 3}
          >
            {isPending ? 'Guardando...' : 'Crear incidencia'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
