import { redirect } from 'next/navigation'
import Link from 'next/link'

import { requireAuth } from '@/lib/auth'
import { canReadSettings } from '@/lib/permissions'
import { SettingsNav } from './settings-nav'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  if (!canReadSettings(session)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Gestión del despacho, usuarios, perfiles operativos y auditoría.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="lg:w-1/4 xl:w-1/5">
          <SettingsNav role={session.role} />
        </aside>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
