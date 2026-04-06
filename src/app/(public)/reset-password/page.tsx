'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, Lock, ArrowRight, ArrowLeft } from 'lucide-react'

import { resetPasswordAction } from './actions'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">Aviso</h3>
          <p className="text-sm text-muted-foreground">
            El enlace de recuperación no es válido o está incompleto.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring w-full"
        >
          Solicitar un nuevo enlace
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('token', token as string)

    try {
      const result = await resetPasswordAction(formData)

      if (result.error) {
        setErrorMessage(result.error)
        setStatus('error')
        return
      }

      if (result.success) {
        // Redirigir al login despues de cambiar contraseña
        router.push('/login?reset=1')
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('Error interno del servidor')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="reset-password-form">
      <div className="space-y-2">
        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nueva Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>

      {status === 'error' ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === 'loading'}
        data-testid="reset-submit"
        className="group w-full rounded-lg bg-gradient-to-r from-primary to-blue-600 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center justify-center gap-2">
          {status === 'loading' ? 'Guardando...' : 'Cambiar contraseña'}
          {status !== 'loading' ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /> : null}
        </span>
      </button>

      <div className="mt-4 text-center">
        <Link href="/login" className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">COMUNET</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Crear nueva contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Introduce una nueva contraseña segura para tu cuenta.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Cargando...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
