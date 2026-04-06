'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Mail, ArrowRight, ArrowLeft } from 'lucide-react'

import { forgotPasswordAction } from './actions'

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage(null)

    const formData = new FormData(event.currentTarget)
    try {
      const result = await forgotPasswordAction(formData)

      if (result.error) {
        setErrorMessage(result.error)
        setStatus('error')
        return
      }

      if (result.success) {
        setStatus('success')
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('Error interno del servidor')
      setStatus('error')
    }
  }

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
          <h1 className="text-xl font-semibold text-foreground">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === 'success' ? 'Revisa tu correo electrónico.' : 'Te enviaremos un enlace para crear una nueva contraseña segura.'}
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg">
          {status === 'success' ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Correo enviado</h3>
                <p className="text-sm text-muted-foreground">
                  Si la dirección de correo ingresada está registrada, recibirás un enlace de recuperación en los próximos minutos.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring w-full"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="forgot-password-form">
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="ejemplo@comunet.es"
                    data-testid="forgot-email"
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
                data-testid="forgot-submit"
                className="group w-full rounded-lg bg-gradient-to-r from-primary to-blue-600 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {status === 'loading' ? 'Enviando...' : 'Enviar enlace de recuperación'}
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
          )}
        </div>
      </div>
    </div>
  )
}
