import { redirect } from 'next/navigation'
import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { getOfficeProfile } from '@/modules/settings/server/queries'
import { canManageOfficeSettings, canReadSettings } from '@/lib/permissions'
import { SettingsProfileForm } from './settings-profile-form'

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
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Perfil del Despacho</h2>
          <p className="text-sm text-muted-foreground">
            Información fiscal y de contacto de la administración de fincas.
          </p>
        </div>
        
        <SettingsProfileForm office={office} canEdit={canEdit} />
      </section>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Métricas del Sistema</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border p-4 bg-muted/20">
            <div className="text-sm font-medium text-muted-foreground">Comunidades Activas</div>
            <div className="mt-2 text-2xl font-bold">{office._count.communities}</div>
            <Link href="/communities" className="mt-2 block text-xs text-primary hover:underline">Gestionar comunidades</Link>
          </div>
          <div className="rounded-md border p-4 bg-muted/20">
            <div className="text-sm font-medium text-muted-foreground">Usuarios Activos</div>
            <div className="mt-2 text-2xl font-bold">{office._count.users}</div>
            <Link href="/settings/users" className="mt-2 block text-xs text-primary hover:underline">Gestionar usuarios</Link>
          </div>
          <div className="rounded-md border p-4 bg-muted/20">
            <div className="text-sm font-medium text-muted-foreground">Proveedores Activos</div>
            <div className="mt-2 text-2xl font-bold">{office._count.providers}</div>
            <Link href="/providers" className="mt-2 block text-xs text-primary hover:underline">Gestionar proveedores</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
