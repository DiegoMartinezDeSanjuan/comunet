import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { findBudgetsByOffice } from '@/modules/finances/server/budget-repository'
import Link from 'next/link'
import { Plus, Calculator } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BudgetsPage() {
  const session = await requireAuth()
  
  const budgets = await findBudgetsByOffice(session.officeId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presupuestos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de presupuestos anuales por comunidad
          </p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(session.role) && (
          <Link 
            href="/finance/budgets/new" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Presupuesto
          </Link>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/20">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Comunidad</th>
                <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Año</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Líneas</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Estado</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No hay presupuestos registrados en tu oficina.
                  </td>
                </tr>
              ) : (
                budgets.map((b: any) => (
                  <tr key={b.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/communities/${b.communityId}`} className="font-semibold hover:underline">
                          {b.community.name}
                        </Link>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-center font-medium">{b.year}</td>
                    <td className="p-4 align-middle text-right text-muted-foreground">
                      {b.lines?.length || 0}
                    </td>
                    <td className="p-4 align-middle text-right font-medium">
                      {Number(b.totalAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        b.status === 'APPROVED' ? 'bg-success/20 text-success border-success/20' : 
                        b.status === 'DRAFT' ? 'bg-muted text-muted-foreground border-border' : 
                        'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {b.status === 'APPROVED' ? 'Aprobado' : b.status === 'DRAFT' ? 'Borrador' : 'Cerrado'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link 
                        href={`/finance/budgets/${b.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        Ver Detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
