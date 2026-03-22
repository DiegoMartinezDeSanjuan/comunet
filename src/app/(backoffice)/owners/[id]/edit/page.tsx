export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import { getOwnerDetails } from '@/modules/contacts/server/contact-service'
import { OwnerForm } from '../../new/owner-form'

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'owners.manage')) redirect('/dashboard')

  const { id } = await params
  const owner = await getOwnerDetails(id, session.officeId)

  if (!owner) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Propietario</h1>
        <p className="text-sm text-muted-foreground mt-1">Actualizando ficha de {owner.fullName}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <OwnerForm initialData={owner} />
      </div>
    </div>
  )
}
