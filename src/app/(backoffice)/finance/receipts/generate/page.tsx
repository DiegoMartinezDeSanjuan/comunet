import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { findFeeRulesByOffice } from '@/modules/finances/server/fee-rule-repository'
import { GenerateReceiptsForm } from './generate-receipts-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GenerateReceiptsPage() {
  const session = await requireAuth()
  if (!requirePermission(session, 'finances.manage')) {
    redirect('/dashboard')
  }

  const communities = await prisma.community.findMany({
    where: { officeId: session.officeId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  // Get active fee rules for all those communities
  const feeRules = await findFeeRulesByOffice(session.officeId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/finance/receipts" 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generación Masiva de Recibos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Emite recibos para todos los propietarios basándote en una regla de cuota.
          </p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <GenerateReceiptsForm communities={communities} feeRules={feeRules} />
      </div>
    </div>
  )
}
