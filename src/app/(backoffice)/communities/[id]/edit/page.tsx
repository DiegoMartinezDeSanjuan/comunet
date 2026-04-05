export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { CommunityForm } from '../../new/community-form'
import { getCommunityEditDataQuery } from '@/modules/communities/server/queries'

export default async function EditCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let result
  try {
    result = await getCommunityEditDataQuery(id)
  } catch (e: any) {
    if (e?.message === 'FORBIDDEN') redirect('/communities')
    throw e
  }

  if (!result) {
    notFound()
  }

  const { community } = result

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
