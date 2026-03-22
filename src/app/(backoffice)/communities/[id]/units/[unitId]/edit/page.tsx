export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import { UnitForm } from '../../unit-form'
import { getCommunityUnitsData } from '@/modules/units/server/unit-service'

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) redirect('/dashboard')

  const { id, unitId } = await params
  const { buildings, units } = await getCommunityUnitsData(id)
  
  const unit = units.find(u => u.id === unitId)
  if (!unit) notFound()

  // Prepare initialData to match UnitInput schema
  const initialData = {
    ...unit,
    areaM2: unit.areaM2 ? Number(unit.areaM2) : null,
    coefficient: unit.coefficient ? Number(unit.coefficient) : null,
    quotaPercent: unit.quotaPercent ? Number(unit.quotaPercent) : null,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Unidad</h1>
        <p className="text-sm text-muted-foreground mt-1">Actualizando datos de {unit.reference}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <UnitForm communityId={id} buildings={buildings} initialData={initialData} />
      </div>
    </div>
  )
}
