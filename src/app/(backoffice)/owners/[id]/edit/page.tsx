export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { getOwnerEditDataQuery } from '@/modules/contacts/server/queries'
import { OwnerForm } from '../../new/owner-form'

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let result
  try {
    result = await getOwnerEditDataQuery(id)
  } catch (e: any) {
    if (e?.message === 'FORBIDDEN') redirect('/dashboard')
    throw e
  }

  const { owner } = result
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
