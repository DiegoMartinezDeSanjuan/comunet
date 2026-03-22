'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

import { generateReceiptsSchema, type GenerateReceiptsInput } from '@/modules/finances/schema'
import { generateReceiptsAction } from '@/modules/finances/server/actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle } from 'lucide-react'

interface FormProps {
  communities: { id: string; name: string }[]
  feeRules: any[]
}

export function GenerateReceiptsForm({ communities, feeRules }: FormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultMsg, setResultMsg] = useState<{count: number, message: string} | null>(null)

  const defaultDate = new Date().toISOString().substring(0, 10)

  const form = useForm<GenerateReceiptsInput>({
    resolver: zodResolver(generateReceiptsSchema),
    defaultValues: {
      communityId: '',
      feeRuleId: '',
      periodStart: defaultDate,
      periodEnd: defaultDate,
      issueDate: defaultDate,
      dueDate: defaultDate,
    },
  })

  const selectedCommunity = form.watch('communityId')
  const selectedRuleId = form.watch('feeRuleId')

  const filteredRules = useMemo(() => {
    if (!selectedCommunity) return []
    return feeRules.filter(r => r.communityId === selectedCommunity)
  }, [selectedCommunity, feeRules])

  const selectedRule = useMemo(() => {
    return feeRules.find(r => r.id === selectedRuleId)
  }, [selectedRuleId, feeRules])

  const onSubmit = async (data: GenerateReceiptsInput) => {
    try {
      setIsSubmitting(true)
      setResultMsg(null)
      const res = await generateReceiptsAction(data)
      setResultMsg(res)
      if (res.count > 0) {
        toast({ title: "Generación Completada", description: res.message })
        setTimeout(() => router.push('/finance/receipts'), 2000)
      } else {
        toast({ title: "Sin resultados", description: res.message, variant: 'default' })
      }
    } catch (error: any) {
      toast({
        title: "Error de Validación",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {resultMsg && resultMsg.count === 0 && (
          <div className="bg-orange-50/50 border border-orange-200 text-orange-800 rounded-lg p-4 flex gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-orange-500" />
            <p>{resultMsg.message}</p>
          </div>
        )}

        {resultMsg && resultMsg.count > 0 && (
          <div className="bg-success/10 border border-success/30 text-success rounded-lg p-4 flex gap-3 text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{resultMsg.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="communityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comunidad</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val)
                    form.setValue('feeRuleId', '') // reset rule
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la comunidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {communities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="feeRuleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regla de Cuota Activa</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                  disabled={!selectedCommunity || filteredRules.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedCommunity ? 'Selecciona comunidad primero' :
                        filteredRules.length === 0 ? 'No hay reglas activas' :
                        'Selecciona una regla'
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredRules.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.calculationBase})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRule && (
                  <FormDescription>
                    Base: {selectedRule.calculationBase} — Fijo/Total: {Number(selectedRule.fixedAmount).toLocaleString('es-ES', { style: 'currency', currency:'EUR'})}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inicio Periodo Facturado</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fin Periodo Facturado</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormDescription>Usado para prevenir duplicados.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Emisión</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento / Pago Límite</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Generando...' : 'Generar Recibos'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
