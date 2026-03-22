export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import { CommunityForm } from '../../new/community-form'
import { getCommunityDetails } from '@/modules/communities/server/community-service'

export default async function EditCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) {
    redirect(`/communities`)
  }

  const { id } = await params
  const community = await getCommunityDetails(id, session.officeId)

  if (!community) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Comunidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Actualizando datos de {community.name}
        </p>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <CommunityForm initialData={community} />
      </div>
    </div>
  )
}
