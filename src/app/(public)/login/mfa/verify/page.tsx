import { getMfaSessionUserId, clearMfaSession, createSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { verifyMfaToken } from '@/lib/auth/mfa'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPostLoginRedirect } from '@/lib/auth'

export default async function MfaVerifyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const userId = await getMfaSessionUserId()
  if (!userId) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  // Si no existe, o si no tiene MFA activado y lo forzamos, deberia ir al login normal (o a setup)
  if (!user) {
    redirect('/login')
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    redirect('/login/mfa/setup')
  }

  async function verifyAction(formData: FormData) {
    'use server'
    const code = formData.get('code') as string
    
    if (!code) {
      redirect('/login/mfa/verify?error=missing_code')
    }

    const isValid = verifyMfaToken(code, user!.mfaSecret!)

    if (isValid) {
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
      redirect('/login/mfa/verify?error=invalid_code')
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
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {error === 'invalid_code' ? 'Código incorrecto. Intenta de nuevo.' : 'El código es requerido.'}
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
