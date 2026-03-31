import { requireAuth } from '@/lib/auth'
import { getBudgetDetailsService } from '@/modules/finances/server/budget-service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BudgetLinesTable } from './budget-lines-table'
import { AddBudgetLineDialog } from './add-budget-line-dialog'

export const dynamic = 'force-dynamic'

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  
  const budget = await getBudgetDetailsService(id)
  if (!budget || budget.community.officeId !== session.officeId) {
    notFound()
  }

  const isEditable = budget.status === 'DRAFT'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/finance/budgets" 
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Presupuesto {budget.year} - {budget.community.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                budget.status === 'APPROVED' ? 'bg-success/20 text-success border-success/20' : 
                budget.status === 'DRAFT' ? 'bg-muted text-muted-foreground border-border' : 
                'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {budget.status === 'APPROVED' ? 'Aprobado' : budget.status === 'DRAFT' ? 'Borrador' : 'Cerrado'}
              </span>
              <p className="text-sm text-muted-foreground">
                Total presupuestado: {Number(budget.totalAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>
        </div>
        
        {isEditable && ['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role) && (
          <div className="flex gap-2">
            <AddBudgetLineDialog budgetId={budget.id} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm p-6 overflow-hidden">
        <h2 className="text-lg font-semibold mb-4">Líneas de Presupuesto</h2>
        <BudgetLinesTable lines={budget.lines} isEditable={isEditable} budgetId={budget.id} />
      </div>
    </div>
  )
}
