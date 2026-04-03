import { getMfaSessionUserId, clearMfaSession, createSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { verifyMfaToken, decryptSecret } from '@/lib/auth/mfa'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPostLoginRedirect } from '@/lib/auth'
import { mfaVerifyLimiter } from '@/lib/cache/rate-limit'
import { headers } from 'next/headers'

export default async function MfaVerifyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const userId = await getMfaSessionUserId()
  if (!userId) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  const headerList = await headers()
  // Normalizar la IP: si hay un proxy, coger la primera IP de la cadena (la del cliente original)
  const forwardedFor = headerList.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (headerList.get('x-real-ip') || '127.0.0.1')
  const userAgent = headerList.get('user-agent') || 'unknown'

  // Rate Limiting on view and submit to prevent brute-force
  const rlResult = await mfaVerifyLimiter.check(`${userId}:${ip}`)
  if (!rlResult.allowed) {
    redirect('/login?error=too_many_requests')
  }

  // Si no existe, o si no tiene MFA activado y lo forzamos, deberia ir al login normal (o a setup)
  if (!user) {
    redirect('/login')
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    redirect('/login/mfa/setup')
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    // Si está bloqueado, mejor devolver al login principal para interrumpir todo intento
    redirect('/login?error=account_locked')
  }

  async function verifyAction(formData: FormData) {
    'use server'
    const code = formData.get('code') as string
    
    if (!code) {
      redirect('/login/mfa/verify?error=missing_code')
    }

    const rlVerifyResult = await mfaVerifyLimiter.check(`verify:${userId}:${ip}`)
    if (!rlVerifyResult.allowed) {
      redirect('/login/mfa/verify?error=too_many_requests')
    }

    const rawSecret = decryptSecret(user!.mfaSecret!)
    const isValid = verifyMfaToken(code, rawSecret)

    if (isValid) {
      // Resetear contadores de fallos al éxito
      await prisma.user.update({
        where: { id: userId! },
        data: { failedAttempts: 0, lockoutCount: 0, lockedUntil: null },
      })

      // Auditoría éxito
      await prisma.auditLog.create({
        data: {
          action: 'MFA_VERIFY',
          entityType: 'USER',
          entityId: userId!,
          metaJson: JSON.stringify({ 
            note: 'MFA verified successfully', 
            ip, 
            userAgent, 
            method: 'totp', 
            success: true 
          }),
          officeId: user!.officeId,
          userId: userId!,
        },
      })

      await clearMfaSession()
      await createSession({
        userId: user!.id,
        officeId: user!.officeId,
        role: user!.role,
        name: user!.name,
        email: user!.email,
        linkedOwnerId: user!.linkedOwnerId,
        linkedProviderId: user!.linkedProviderId,
      })

      redirect(getPostLoginRedirect(user!.role))
    } else {
      // Incrementar intentos y bloquear si procede
      const newAttempts = user!.failedAttempts + 1
      let newLockoutCount = user!.lockoutCount
      let newStatus = user!.status
      let newLockedUntil = user!.lockedUntil

      if (newAttempts % 5 === 0) {
        newLockoutCount++
        if (newLockoutCount >= 5) {
          newStatus = 'BLOCKED'
          newLockedUntil = null
        } else {
          newLockedUntil = new Date(Date.now() + 15 * 60 * 1000)
        }
      }
      
      await prisma.user.update({
        where: { id: userId! },
        data: { 
          failedAttempts: newAttempts,
          lockoutCount: newLockoutCount,
          status: newStatus,
          lockedUntil: newLockedUntil
        },
      })

      // Auditoría fallo
      const shouldLock = newLockedUntil !== null || newStatus === 'BLOCKED'
      
      await prisma.auditLog.create({
        data: {
          action: 'MFA_VERIFY_FAIL',
          entityType: 'USER',
          entityId: userId!,
          metaJson: JSON.stringify({ 
            note: shouldLock ? 'MFA failed and account temporarily or permanently locked' : 'MFA verification failed',
            ip, 
            userAgent, 
            method: 'totp', 
            success: false 
          }),
          officeId: user!.officeId,
          userId: userId!,
        },
      })
      
      if (shouldLock) {
        redirect('/login?error=account_locked')
      } else {
        redirect('/login/mfa/verify?error=invalid_code')
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Verificación en dos pasos</h1>
        <p className="text-sm text-muted-foreground">
          Introduce el código generado por tu aplicación autenticadora.
        </p>
      </div>
      
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200 mb-4">
          {error === 'account_locked' && 'Cuenta temporalmente bloqueada. Por favor, espera 15 minutos o contacta con el administrador.'}
          {error === 'too_many_requests' && 'Demasiados intentos. Por favor, espera un momento antes de volver a intentarlo.'}
          {error === 'invalid_code' && 'Código no válido o expirado. Por favor, inténtelo de nuevo.'}
          {error === 'missing_code' && 'El código es requerido.'}
        </div>
      )}

      <form action={verifyAction} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <label htmlFor="code" className="text-sm font-medium">Código</label>
          <input
            id="code"
            name="code"
            type="text"
            required
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-center tracking-widest font-mono"
            placeholder="000000"
            autoFocus
          />
        </div>
        
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          Iniciar Sesión
        </button>
      </form>
      
      <div className="text-center text-sm">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Cancelar y volver al inicio
        </Link>
      </div>
    </div>
  )
}
