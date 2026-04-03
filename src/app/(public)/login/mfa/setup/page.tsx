import { getMfaSessionUserId, clearMfaSession, createSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateMfaSecret, generateQrCodeDataUrl, verifyMfaToken, encryptSecret, decryptSecret } from '@/lib/auth/mfa'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPostLoginRedirect } from '@/lib/auth'
import { mfaSetupLimiter } from '@/lib/cache/rate-limit'
import { headers } from 'next/headers'

export default async function MfaSetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const userId = await getMfaSessionUserId()
  if (!userId) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  // Rate Limiting on view and submit to prevent basic spam
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (headerList.get('x-real-ip') || '127.0.0.1')
  const userAgent = headerList.get('user-agent') || 'unknown'
  
  const rlResult = await mfaSetupLimiter.check(`${userId}:${ip}`)
  if (!rlResult.allowed) {
    redirect('/login?error=too_many_requests')
  }

  if (!user || user.mfaEnabled) {
    redirect('/login')
  }

  // Generar MFA Secret para este usuario por primera vez (no guardado aún cifrado, se verificará luego)
  let rawSecret = user.mfaSecret ? decryptSecret(user.mfaSecret) : generateMfaSecret()
  if (user.mfaEnabled === false && user.mfaSecret === null) {
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: encryptSecret(rawSecret) },
    })
  }

  const qrCodeUrl = await generateQrCodeDataUrl(user.email, rawSecret)

  async function verifySetup(formData: FormData) {
    'use server'
    const code = formData.get('code') as string
    
    if (!code) {
      redirect('/login/mfa/setup?error=missing_code')
    }

    const rlVerifyResult = await mfaSetupLimiter.check(`verify:${userId}:${ip}`)
    if (!rlVerifyResult.allowed) {
      redirect('/login/mfa/setup?error=too_many_requests')
    }

    const isValid = verifyMfaToken(code, rawSecret)

    if (isValid) {
      await prisma.user.update({
        where: { id: userId! },
        data: { 
          mfaEnabled: true,
          failedAttempts: 0,
          lockedUntil: null,
          lockoutCount: 0
        },
      })
      // Auditoría
      await prisma.auditLog.create({
        data: {
          action: 'MFA_ENABLE',
          entityType: 'USER',
          entityId: userId!,
          metaJson: JSON.stringify({ 
            note: 'User successfully configured MFA TOTP',
            ip,
            userAgent,
            method: 'totp',
            success: true
          }),
          officeId: user!.officeId,
          userId: userId!,
        },
      })
      
      const updatedUser = await prisma.user.findUnique({ where: { id: userId! } })
      
      // Iniciar sesión real
      await clearMfaSession()
      await createSession({
        userId: updatedUser!.id,
        officeId: updatedUser!.officeId,
        role: updatedUser!.role,
        name: updatedUser!.name,
        email: updatedUser!.email,
        linkedOwnerId: updatedUser!.linkedOwnerId,
        linkedProviderId: updatedUser!.linkedProviderId,
      })

      redirect(getPostLoginRedirect(updatedUser!.role))
    } else {
      redirect('/login/mfa/setup?error=invalid_code')
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Configure Authenticator</h1>
        <p className="text-sm text-muted-foreground">
          Por seguridad, tu rol requiere autenticación de dos factores (MFA). 
          Escanea el código con Google Authenticator o Authy.
        </p>
      </div>
      
      <div className="flex justify-center bg-white p-4 rounded-lg shadow-sm border">
        <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} />
      </div>

      <div className="text-center text-sm font-mono bg-muted p-2 rounded">
        {rawSecret}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {error === 'invalid_code' ? 'Código incorrecto. Intenta de nuevo.' : 'El código es requerido.'}
        </div>
      )}

      <form action={verifySetup} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <label htmlFor="code">Código de 6 dígitos</label>
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
          />
        </div>
        
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          Verificar y continuar
        </button>
      </form>
      
      <div className="text-center text-sm">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
