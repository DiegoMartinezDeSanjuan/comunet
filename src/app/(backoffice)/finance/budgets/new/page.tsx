import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { BudgetForm } from './budget-form'

export const dynamic = 'force-dynamic'

export default async function NewBudgetPage() {
  const session = await requireAuth()
  if (!requirePermission(session, 'finances.manage')) {
    redirect('/dashboard')
  }

  // Get communities for the dropdown
  const communities = await prisma.community.findMany({
    where: { officeId: session.officeId },
    select: { id: true, name: true, fiscalYear: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nuevo Presupuesto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inicia un nuevo ejercicio presupuestario para una comunidad
        </p>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <BudgetForm communities={communities} />
      </div>
    </div>
  )
}
