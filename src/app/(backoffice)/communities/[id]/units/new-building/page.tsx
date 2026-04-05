export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { BuildingForm } from './building-form'
import { requireCommunityManageQuery } from '@/modules/communities/server/queries'

export default async function NewBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    await requireCommunityManageQuery()
  } catch (e: any) {
    if (e?.message === 'FORBIDDEN') redirect('/dashboard')
    throw e
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Añadir Edificio o Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Registra un nuevo edificio para agrupar las unidades de esta comunidad.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <BuildingForm communityId={id} />
      </div>
    </div>
  )
}
