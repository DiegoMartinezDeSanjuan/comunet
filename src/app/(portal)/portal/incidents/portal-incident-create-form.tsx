'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ChevronDown, Plus } from 'lucide-react'

import { createPortalIncidentAction } from '@/modules/portal/server/actions'
import { INCIDENT_PRIORITY_LABELS } from '@/components/portal/ui'

interface PortalIncidentCreateFormProps {
  communities: { id: string; name: string; canCreateCommunityIncident: boolean }[]
  units: { id: string; reference: string; communityName: string }[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Creando...' : 'Crear incidencia'}
    </button>
  )
}

export function PortalIncidentCreateForm({
  communities,
  units,
}: PortalIncidentCreateFormProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Alta de incidencia</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crea una nueva incidencia para tus unidades o comunidad.
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible Body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border p-5">
          <p className="mb-5 text-sm text-muted-foreground">
            El servidor valida siempre el alcance por unidad o por presidencia activa antes de
            crear la incidencia.
          </p>

          <form action={createPortalIncidentAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="createCommunityId" className="text-sm font-medium text-foreground">
                Comunidad
              </label>
              <select
                id="createCommunityId"
                name="communityId"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecciona una comunidad</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                    {community.canCreateCommunityIncident ? ' · Presidencia activa' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="createUnitId" className="text-sm font-medium text-foreground">
                Unidad
              </label>
              <select
                id="createUnitId"
                name="unitId"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Incidencia comunitaria (solo presidencia activa)</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.communityName} · {unit.reference}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Si no eliges unidad, el alta solo se aceptará cuando exista cargo activo de
                presidencia en la comunidad seleccionada.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="createIncidentTitle" className="text-sm font-medium text-foreground">
                Título
              </label>
              <input
                id="createIncidentTitle"
                name="title"
                type="text"
                required
                minLength={3}
                maxLength={160}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Describe brevemente la incidencia"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="createIncidentDescription"
                className="text-sm font-medium text-foreground"
              >
                Descripción
              </label>
              <textarea
                id="createIncidentDescription"
                name="description"
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Añade contexto, ubicación exacta o cualquier dato útil para el seguimiento"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="createPriority" className="text-sm font-medium text-foreground">
                  Prioridad
                </label>
                <select
                  id="createPriority"
                  name="priority"
                  defaultValue="MEDIUM"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(INCIDENT_PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="createDueAt" className="text-sm font-medium text-foreground">
                  Fecha objetivo
                </label>
                <input
                  id="createDueAt"
                  name="dueAt"
                  type="date"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
