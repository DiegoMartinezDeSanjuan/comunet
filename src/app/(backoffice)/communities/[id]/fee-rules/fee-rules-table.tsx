'use client'

import { useRouter } from 'next/navigation'
import { toggleFeeRuleAction } from '@/modules/finances/server/actions'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Calendar } from 'lucide-react'

export function FeeRulesTable({ rules, communityId }: { rules: any[], communityId: string }) {
  const router = useRouter()
  const { toast } = useToast()

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleFeeRuleAction(id, communityId, active)
      toast({ title: active ? 'Regla activada' : 'Regla desactivada' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/20">
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Frecuencia</th>
            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Base Cálc.</th>
            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Importe Fijo</th>
            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Desde</th>
            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Activo</th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                No hay reglas de cuota configuradas.
              </td>
            </tr>
          ) : (
            rules.map((r: any) => (
              <tr key={r.id} className={`border-b transition-colors hover:bg-muted/50 ${!r.active && 'opacity-60'}`}>
                <td className="p-4 align-middle font-medium">{r.name}</td>
                <td className="p-4 align-middle text-center">{r.frequency}</td>
                <td className="p-4 align-middle text-center">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                    {r.calculationBase}
                  </span>
                </td>
                <td className="p-4 align-middle text-right font-medium">
                  {r.fixedAmount ? Number(r.fixedAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '-'}
                </td>
                <td className="p-4 align-middle text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(r.startDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-4 align-middle text-center">
                  <Switch 
                    checked={r.active} 
                    onCheckedChange={(val) => handleToggle(r.id, val)} 
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
