import { requireAuth } from '@/lib/auth'
import { getCommunityDetails } from '@/modules/communities/server/service'
import { requirePermission } from '@/lib/permissions'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FeeRuleForm } from './fee-rule-form'

export const dynamic = 'force-dynamic'

export default async function NewFeeRulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'finances.manage')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const community = await getCommunityDetails(id, session.officeId)
  
  if (!community) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/communities/${community.id}/fee-rules`} 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Regla de Cuota</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Para la comunidad {community.name}
          </p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <FeeRuleForm communityId={community.id} />
      </div>
    </div>
  )
}
