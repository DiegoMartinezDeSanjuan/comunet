'use server'

import { requestPasswordReset } from '@/modules/auth/server/service'
import { headers } from 'next/headers'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Correo electrónico no válido').min(1, 'El correo es obligatorio'),
})

export async function forgotPasswordAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               headersList.get('x-real-ip') || 
               'unknown'
    const userAgent = headersList.get('user-agent') || undefined

    const parsed = forgotPasswordSchema.safeParse({
      email: formData.get('email'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    await requestPasswordReset(parsed.data.email, ip, userAgent)

    return { success: true }
  } catch (error: any) {
    if (error.message.includes('Demasiadas solicitudes')) {
      return { error: error.message }
    }
    console.error('[auth] process failed:', error)
    return { error: 'Ocurrió un error al procesar tu solicitud.' }
  }
}
