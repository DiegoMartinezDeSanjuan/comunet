export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { getTenantEditDataQuery } from '@/modules/contacts/server/queries'
import { TenantForm } from '../../new/tenant-form'

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let result
  try {
    result = await getTenantEditDataQuery(id)
  } catch (e: any) {
    if (e?.message === 'FORBIDDEN') redirect('/dashboard')
    throw e
  }

  const { tenant } = result
  if (!tenant) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Inquilino</h1>
        <p className="text-sm text-muted-foreground mt-1">Actualizando ficha de {tenant.fullName}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <TenantForm initialData={tenant} />
      </div>
    </div>
  )
}
