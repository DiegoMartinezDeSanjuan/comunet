'use server'

import { executePasswordReset } from '@/modules/auth/server/service'
import { headers } from 'next/headers'
import { z } from 'zod'

import { passwordSchema } from '@/modules/auth/schema'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token inválido'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export async function resetPasswordAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               headersList.get('x-real-ip') || 
               'unknown'
    const userAgent = headersList.get('user-agent') || undefined

    const parsed = resetPasswordSchema.safeParse({
      token: formData.get('token'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    await executePasswordReset(parsed.data.token, parsed.data.password, ip, userAgent)

    return { success: true }
  } catch (error: any) {
    if (error.message.includes('inválido') || error.message.includes('bloqueado') || error.message.includes('expirado')) {
      return { error: error.message }
    }
    console.error('[auth] reset failed:', error)
    return { error: 'Ocurrió un error al procesar tu solicitud.' }
  }
}
