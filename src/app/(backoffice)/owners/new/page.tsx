export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { OwnerForm } from './owner-form'

export default async function NewOwnerPage() {
  const session = await requireAuth()
  if (!requirePermission(session, 'owners.manage')) redirect('/dashboard')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Añadir Propietario</h1>
        <p className="text-sm text-muted-foreground mt-1">Registra a un nuevo propietario en la base de datos central</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <OwnerForm />
      </div>
    </div>
  )
}
