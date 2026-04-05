import { getBudgetFormDataQuery } from '@/modules/finances/server/queries'
import { BudgetForm } from './budget-form'

export const dynamic = 'force-dynamic'

export default async function NewBudgetPage() {
  const { communities } = await getBudgetFormDataQuery()

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
