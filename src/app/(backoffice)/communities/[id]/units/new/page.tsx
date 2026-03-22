export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { UnitForm } from '../unit-form'
import { getCommunityUnitsData } from '@/modules/units/server/unit-service'

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) redirect('/dashboard')

  const { id } = await params
  const { buildings } = await getCommunityUnitsData(id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Añadir Unidad</h1>
        <p className="text-sm text-muted-foreground mt-1">Registra una nueva propiedad en esta comunidad</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <UnitForm communityId={id} buildings={buildings} />
      </div>
    </div>
  )
}
