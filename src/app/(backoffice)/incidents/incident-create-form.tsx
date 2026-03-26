'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { createIncidentAction } from '@/modules/incidents/server/actions'

type UnitOption = {
  id: string
  reference: string
}

type CommunityOption = {
  id: string
  name: string
  units: UnitOption[]
}

type ProviderOption = {
  id: string
  name: string
  category: string | null
}

type IncidentCreateFormProps = {
  communities: CommunityOption[]
  providers: ProviderOption[]
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

export function IncidentCreateForm({
  communities,
  providers,
}: IncidentCreateFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

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
    return communities.find((community) => community.id === communityId)?.units ?? []
  }, [communities, communityId])

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

        router.push(`/incidents/${created.id}`)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo crear la incidencia.'

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm" data-testid="incident-create-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Nueva incidencia</h2>
        <p className="text-sm text-muted-foreground">
          Alta manual desde backoffice con comunidad, unidad opcional,
          prioridad y asignación inicial de proveedor.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="incident-create-title" className="text-sm font-medium">
            Título
          </label>
          <Input
            id="incident-create-title"
            name="title"
            data-testid="incident-create-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Fuga en bajante del portal B"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="incident-create-description" className="text-sm font-medium">
            Descripción
          </label>
          <Textarea
            id="incident-create-description"
            name="description"
            data-testid="incident-create-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe el problema, ubicación y contexto relevante."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-create-community" className="text-sm font-medium">
            Comunidad
          </label>
          <select
            id="incident-create-community"
            name="communityId"
            data-testid="incident-create-community"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={communityId}
            onChange={(event) => {
              setCommunityId(event.target.value)
              setUnitId('')
            }}
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
          <label htmlFor="incident-create-unit" className="text-sm font-medium">
            Unidad (opcional)
          </label>
          <select
            id="incident-create-unit"
            name="unitId"
            data-testid="incident-create-unit"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            disabled={!communityId}
          >
            <option value="">Sin unidad asociada</option>
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.reference}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-create-provider" className="text-sm font-medium">
            Proveedor asignado
          </label>
          <select
            id="incident-create-provider"
            name="assignedProviderId"
            data-testid="incident-create-provider"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={assignedProviderId}
            onChange={(event) => setAssignedProviderId(event.target.value)}
          >
            <option value="">Sin asignar</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
                {provider.category ? ` · ${provider.category}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-create-priority" className="text-sm font-medium">
            Prioridad
          </label>
          <select
            id="incident-create-priority"
            name="priority"
            data-testid="incident-create-priority"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
            }
          >
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-create-reported-at" className="text-sm font-medium">
            Reportada el
          </label>
          <Input
            id="incident-create-reported-at"
            name="reportedAt"
            data-testid="incident-create-reported-at"
            type="date"
            value={reportedAt}
            onChange={(event) => setReportedAt(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-create-due-at" className="text-sm font-medium">
            Vencimiento
          </label>
          <Input
            id="incident-create-due-at"
            name="dueAt"
            data-testid="incident-create-due-at"
            type="date"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          data-testid="incident-create-submit"
          onClick={handleSubmit}
          disabled={isPending || !communityId || title.trim().length < 3}
        >
          {isPending ? 'Guardando...' : 'Crear incidencia'}
        </Button>
      </div>
    </section>
  )
}
