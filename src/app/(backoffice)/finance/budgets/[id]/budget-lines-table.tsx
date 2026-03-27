'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBudgetLineAction } from '@/modules/finances/server/actions'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function BudgetLinesTable({ lines, isEditable, budgetId }: { lines: any[], isEditable: boolean, budgetId: string }) {
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta línea?')) return
    try {
      setDeletingId(id)
      await deleteBudgetLineAction(id, budgetId)
      toast({ title: 'Línea eliminada' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/20">
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Concepto</th>
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Periodicidad</th>
            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Importe</th>
            {isEditable && <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-[100px]">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={isEditable ? 5 : 4} className="p-8 text-center text-muted-foreground">
                No hay líneas en este presupuesto.
              </td>
            </tr>
          ) : (
            lines.map((line: any) => (
              <tr key={line.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle font-medium">{line.concept}</td>
                <td className="p-4 align-middle">{line.category || '-'}</td>
                <td className="p-4 align-middle">{line.periodicity || '-'}</td>
                <td className="p-4 align-middle text-right">
                  {Number(line.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </td>
                {isEditable && (
                  <td className="p-4 align-middle text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={deletingId === line.id}
                      onClick={() => handleDelete(line.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
        <tfoot className="bg-muted/50 font-semibold border-t">
          <tr>
            <td colSpan={3} className="p-4 text-right">Total Presupuesto:</td>
            <td className="p-4 text-right">
              {lines.reduce((sum, line) => sum + Number(line.amount), 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </td>
            {isEditable && <td className="p-4"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
