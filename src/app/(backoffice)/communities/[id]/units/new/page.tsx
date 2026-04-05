export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { UnitForm } from '../unit-form'
import { getCommunityNewUnitPageQuery } from '@/modules/communities/server/queries'

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let result
  try {
    result = await getCommunityNewUnitPageQuery(id)
  } catch (e: any) {
    if (e?.message === 'FORBIDDEN') redirect('/dashboard')
    throw e
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Añadir Unidad</h1>
        <p className="text-sm text-muted-foreground mt-1">Registra una nueva propiedad en esta comunidad</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <UnitForm communityId={id} buildings={result.buildings} />
      </div>
    </div>
  )
}
