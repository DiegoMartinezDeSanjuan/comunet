'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, ChevronDown, ArrowRight } from 'lucide-react'

import { loginAction } from './actions'

const DEMO_ACCOUNTS = [
  'admin@fincasmartinez.es',
  'manager@fincasmartinez.es',
  'accountant@fincasmartinez.es',
  'viewer@fincasmartinez.es',
  'presidenta@comunet.test',
  'propietario@comunet.test',
  'proveedor.fontaneria@comunet.test',
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await loginAction(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.redirect) {
      router.push(result.redirect)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left: Hero panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        {/* Animated grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-lg space-y-8 px-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Gestión inteligente de comunidades de propietarios
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            La plataforma líder en España para administradores que buscan excelencia,
            transparencia y eficiencia digital.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-left">
            {[
              { title: 'Finanzas', desc: 'Recibos, cobros y deuda en tiempo real' },
              { title: 'Incidencias', desc: 'Seguimiento completo con proveedores' },
              { title: 'Documentos', desc: 'Repositorio organizado por comunidad' },
              { title: 'Reportes', desc: 'Analítica operativa y financiera' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm p-3 space-y-1"
              >
                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Brand (mobile) */}
          <div className="text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight">COMUNET</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Bienvenido de nuevo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Introduce tus credenciales para acceder al portal.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
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
                    data-testid="login-email"
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contraseña
                  </label>
                  <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors">
                    ¿Olvidaste la contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    data-testid="login-password"
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="group w-full rounded-lg bg-gradient-to-r from-primary to-blue-600 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  {!loading ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /> : null}
                </span>
              </button>
            </form>
          </div>

          {/* Demo accounts (collapsible) */}
          <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Cuentas de demostración</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                showDemo ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border/30 px-4 py-3 space-y-1.5">
                  {DEMO_ACCOUNTS.map((account) => (
                    <div key={account} className="text-xs text-muted-foreground font-mono">
                      {account}
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Contraseña:{' '}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-semibold">Demo1234!</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacidad</span>
            <span>·</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Términos</span>
            <span>·</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Ayuda</span>
          </div>
        </div>
      </div>
    </div>
  )
}
