'use server'

import { authenticate, createSession, getPostLoginRedirect } from '@/lib/auth'
import { logAudit } from '@/modules/audit/server/services'
import { loginLimiter } from '@/lib/cache/rate-limit'
import { headers } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export async function loginAction(formData: FormData): Promise<{ error?: string; redirect?: string }> {
  // Rate limiting protection
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             headersList.get('x-real-ip') || 
             'unknown'
             
  const limitResult = await loginLimiter.check(ip)
  if (!limitResult.allowed) {
    return { error: 'Demasiados intentos. Por favor, inténtelo de nuevo más tarde.' }
  }

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

  await logAudit({
    officeId: session.officeId,
    userId: session.userId,
    entityType: 'User',
    entityId: session.userId,
    action: 'LOGIN',
    meta: { email: session.email },
  })

  return { redirect: getPostLoginRedirect(session.role) }
}
