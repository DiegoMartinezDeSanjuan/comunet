'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth'
import {
  addPortalIncidentSharedComment,
  createPortalIncident,
} from './incidents'
import { isPortalOwnerPresidentRole, isPortalProviderRole } from './policy'
import {
  addProviderIncidentComment,
  changeProviderIncidentStatus,
} from './provider'

const createPortalIncidentFormSchema = z.object({
  communityId: z.string().trim().min(1, 'Selecciona una comunidad'),
  unitId: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(160),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueAt: z.string().trim().optional(),
})

const createPortalIncidentCommentSchema = z.object({
  incidentId: z.string().trim().min(1),
  body: z
    .string()
    .trim()
    .min(1, 'Escribe un comentario')
    .max(4000),
})

function normalizeDateInput(dateText: string | undefined): string | null {
  if (!dateText) {
    return null
  }

  const trimmed = dateText.trim()
  if (!trimmed) {
    return null
  }

  const parsed = new Date(`${trimmed}T23:59:59.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    if (error.message === 'FORBIDDEN') {
      return 'No tienes permisos para completar esta acción en el portal.'
    }

    return error.message
  }

  return 'No se pudo completar la acción solicitada.'
}

export async function createPortalIncidentAction(formData: FormData) {
  const session = await requireAuth()
  if (!isPortalOwnerPresidentRole(session.role)) {
    redirect('/portal')
  }

  const parsed = createPortalIncidentFormSchema.safeParse({
    communityId: formData.get('communityId'),
    unitId: formData.get('unitId'),
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority') ?? 'MEDIUM',
    dueAt: formData.get('dueAt'),
  })

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Revisa los datos del formulario.'
    redirect(`/portal/incidents?error=${encodeURIComponent(message)}`)
  }

  let createdIncidentId: string

  try {
    const incident = await createPortalIncident(session, {
      communityId: parsed.data.communityId,
      unitId: parsed.data.unitId ? parsed.data.unitId : null,
      title: parsed.data.title,
      description: parsed.data.description ? parsed.data.description : null,
      priority: parsed.data.priority,
      dueAt: normalizeDateInput(parsed.data.dueAt),
    })

    createdIncidentId = incident.id
  } catch (error) {
    redirect(`/portal/incidents?error=${encodeURIComponent(getErrorMessage(error))}`)
  }

  revalidatePath('/portal')
  revalidatePath('/portal/incidents')
  revalidatePath(`/portal/incidents/${createdIncidentId}`)

  redirect(`/portal/incidents/${createdIncidentId}?created=1`)
}

export async function addPortalIncidentCommentAction(formData: FormData) {
  const session = await requireAuth()
  if (!isPortalOwnerPresidentRole(session.role)) {
    redirect('/portal')
  }

  const parsed = createPortalIncidentCommentSchema.safeParse({
    incidentId: formData.get('incidentId'),
    body: formData.get('body'),
  })

  if (!parsed.success) {
    const fallbackIncidentId = String(formData.get('incidentId') ?? '').trim()
    const message = parsed.error.issues[0]?.message ?? 'Revisa el comentario antes de enviarlo.'
    const target = fallbackIncidentId
      ? `/portal/incidents/${fallbackIncidentId}`
      : '/portal/incidents'

    redirect(`${target}?error=${encodeURIComponent(message)}`)
  }

  try {
    await addPortalIncidentSharedComment(session, parsed.data)
  } catch (error) {
    redirect(
      `/portal/incidents/${parsed.data.incidentId}?error=${encodeURIComponent(getErrorMessage(error))}`,
    )
  }

  revalidatePath('/portal')
  revalidatePath('/portal/incidents')
  revalidatePath(`/portal/incidents/${parsed.data.incidentId}`)

  redirect(`/portal/incidents/${parsed.data.incidentId}?commented=1`)
}

// ─── Provider Actions ────────────────────────────────────

const providerCommentSchema = z.object({
  incidentId: z.string().trim().min(1),
  body: z.string().trim().min(1, 'Escribe un comentario').max(4000),
})

const providerStatusSchema = z.object({
  incidentId: z.string().trim().min(1),
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'WAITING_VENDOR', 'RESOLVED']),
})

export async function addProviderCommentAction(formData: FormData) {
  const session = await requireAuth()
  if (!isPortalProviderRole(session.role)) {
    redirect('/portal')
  }

  const parsed = providerCommentSchema.safeParse({
    incidentId: formData.get('incidentId'),
    body: formData.get('body'),
  })

  if (!parsed.success) {
    const fallback = String(formData.get('incidentId') ?? '').trim()
    const message = parsed.error.issues[0]?.message ?? 'Revisa el comentario.'
    redirect(`/portal/incidents/${fallback}?error=${encodeURIComponent(message)}`)
  }

  try {
    await addProviderIncidentComment(session, parsed.data.incidentId, parsed.data.body)
  } catch (error) {
    redirect(
      `/portal/incidents/${parsed.data.incidentId}?error=${encodeURIComponent(getErrorMessage(error))}`,
    )
  }

  revalidatePath('/portal')
  revalidatePath('/portal/incidents')
  revalidatePath(`/portal/incidents/${parsed.data.incidentId}`)
  redirect(`/portal/incidents/${parsed.data.incidentId}?commented=1`)
}

export async function changeProviderStatusAction(formData: FormData) {
  const session = await requireAuth()
  if (!isPortalProviderRole(session.role)) {
    redirect('/portal')
  }

  const parsed = providerStatusSchema.safeParse({
    incidentId: formData.get('incidentId'),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    const fallback = String(formData.get('incidentId') ?? '').trim()
    redirect(`/portal/incidents/${fallback}?error=${encodeURIComponent('Estado no válido')}`)
  }

  try {
    await changeProviderIncidentStatus(session, parsed.data.incidentId, parsed.data.status)
  } catch (error) {
    redirect(
      `/portal/incidents/${parsed.data.incidentId}?error=${encodeURIComponent(getErrorMessage(error))}`,
    )
  }

  revalidatePath('/portal')
  revalidatePath('/portal/incidents')
  revalidatePath(`/portal/incidents/${parsed.data.incidentId}`)
  redirect(`/portal/incidents/${parsed.data.incidentId}?status_changed=1`)
}
