import { requireAuth } from '@/lib/auth'
import { getCommunityDetails } from '@/modules/communities/server/community-service'
import { getCommunityFeeRulesService } from '@/modules/finances/server/fee-rule-service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import { FeeRulesTable } from './fee-rules-table'

export const dynamic = 'force-dynamic'

export default async function FeeRulesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  
  const community = await getCommunityDetails(id, session.officeId)
  if (!community) notFound()

  const rules = await getCommunityFeeRulesService(id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href={`/communities/${community.id}`} 
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reglas de Cuota</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configuración de generación de recibos para {community.name}
            </p>
          </div>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(session.role) && (
          <div className="flex gap-2">
            <Link 
              href={`/communities/${community.id}/fee-rules/new`} 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Regla
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden p-6">
        <FeeRulesTable rules={rules} communityId={community.id} />
      </div>
    </div>
  )
}
