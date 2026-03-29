import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Settings, Shield, Users, Wrench } from 'lucide-react'

import { requireAuth } from '@/lib/auth'
import { getOfficeProfile } from '@/modules/settings/server/queries'
import { canManageOfficeSettings, canReadSettings } from '@/lib/permissions'
import { SettingsProfileForm } from '@/modules/settings/components/settings-profile-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireAuth()

  if (!canReadSettings(session)) {
    redirect('/dashboard')
  }

  const office = await getOfficeProfile(session.officeId)

  if (!office) {
    return <div>Despacho no encontrado</div>
  }

  const canEdit = canManageOfficeSettings(session)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión del perfil del despacho y métricas del sistema.
        </p>
      </div>

      {/* Profile Card */}
      <section className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Perfil del Despacho</h2>
            <p className="text-xs text-muted-foreground">
              Información fiscal y de contacto de la administración de fincas.
            </p>
          </div>
        </div>
        <div className="p-5">
          <SettingsProfileForm office={office} canEdit={canEdit} />
        </div>
      </section>

      {/* System Metrics */}
      <section className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Métricas del Sistema</h2>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Link
            href="/communities"
            className="group rounded-xl border border-border/50 bg-card/30 p-5 transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-card/60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 transition-colors group-hover:bg-blue-500/25">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{office._count.communities}</p>
                <p className="text-xs text-muted-foreground">Comunidades Activas</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Gestionar comunidades →</p>
          </Link>

          <Link
            href="/settings/users"
            className="group rounded-xl border border-border/50 bg-card/30 p-5 transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-card/60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 transition-colors group-hover:bg-emerald-500/25">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{office._count.users}</p>
                <p className="text-xs text-muted-foreground">Usuarios Activos</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Gestionar usuarios →</p>
          </Link>

          <Link
            href="/providers"
            className="group rounded-xl border border-border/50 bg-card/30 p-5 transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-card/60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 transition-colors group-hover:bg-amber-500/25">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{office._count.providers}</p>
                <p className="text-xs text-muted-foreground">Proveedores Activos</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Gestionar proveedores →</p>
          </Link>
        </div>
      </section>
    </div>
  )
}
