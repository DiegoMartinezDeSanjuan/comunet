'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { feeRuleSchema, type FeeRuleInput } from '@/modules/finances/schema'
import { createFeeRuleAction } from '@/modules/finances/server/actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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

interface FeeRuleFormProps {
  communityId: string
}

export function FeeRuleForm({ communityId }: FeeRuleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FeeRuleInput>({
    resolver: zodResolver(feeRuleSchema) as any,
    defaultValues: {
      communityId,
      name: '',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().substring(0, 10),
      calculationBase: 'COEFFICIENT',
      fixedAmount: 0,
      notes: '',
      active: true,
    },
  })

  const onSubmit = async (data: FeeRuleInput) => {
    try {
      setIsSubmitting(true)
      await createFeeRuleAction(data)
      toast({ title: "Regla creada con éxito" })
      router.push(`/communities/${communityId}/fee-rules`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculationBase = form.watch('calculationBase')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Regla</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Cuota Ordinaria 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecuencia de Emisión</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensual</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                    <SelectItem value="ANNUAL">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio (YYYY-MM-DD)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="calculationBase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base de Cálculo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="COEFFICIENT">Por Coeficiente</SelectItem>
                    <SelectItem value="QUOTA_PERCENT">Por Cuota (%)</SelectItem>
                    <SelectItem value="FIXED">Importe Fijo Lineal</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Cómo se calculará el recibo final para cada unidad.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fixedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {calculationBase === 'FIXED' ? 'Importe Fijo por Unidad (€)' : 'Importe Total a Repartir (€)'}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    value={field.value === null ? '' : field.value}
                    onChange={e => {
                      const val = e.target.valueAsNumber
                      field.onChange(isNaN(val) ? null : val)
                    }} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Regla Activa</FormLabel>
                <FormDescription>
                  Si está inactiva, no aparecerá para generar recibos masivos.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas / Descripción interna</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observaciones de esta regla..." 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            {isSubmitting ? 'Guardando...' : 'Crear Regla'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
