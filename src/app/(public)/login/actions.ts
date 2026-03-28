'use server'

import { authenticate, createSession, getPostLoginRedirect } from '@/lib/auth'
import { logAudit } from '@/modules/audit/server/services'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export async function loginAction(formData: FormData): Promise<{ error?: string; redirect?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const session = await authenticate(parsed.data.email, parsed.data.password)
  if (!session) {
    return { error: 'Correo o contraseña incorrectos' }
  }

  await createSession(session)

  logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'User',
    entityId: session.userId,
    action: 'LOGIN',
    meta: { email: session.email },
  })

  return { redirect: getPostLoginRedirect(session.role) }
}
