'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { budgetSchema, type BudgetInput } from '@/modules/finances/schema'
import { createBudgetAction } from '@/modules/finances/server/actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/components/ui/use-toast'

interface BudgetFormProps {
  communities: { id: string, name: string, fiscalYear: number }[]
}

export function BudgetForm({ communities }: BudgetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      communityId: '',
      year: new Date().getFullYear(),
      status: 'DRAFT',
    },
  })

  const onSubmit = async (data: BudgetInput) => {
    try {
      setIsSubmitting(true)
      const res = await createBudgetAction(data)
      toast({
        title: "Presupuesto creado",
        description: "El esquema de presupuesto se ha guardado exitosamente.",
      })
      router.push(`/finance/budgets/${res.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el presupuesto. Asegúrate de que no exista ya uno para ese año.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="communityId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Comunidad</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val)
                    // Auto-fill year to that community's active fiscal year if desired
                    const c = communities.find(c => c.id === val)
                    if (c && c.fiscalYear) {
                      form.setValue('year', c.fiscalYear)
                    }
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una comunidad" />
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
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año del Presupuesto</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Inicial</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="APPROVED">Aprobado</SelectItem>
                  </SelectContent>
                </Select>
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
            {isSubmitting ? 'Guardando...' : 'Crear Presupuesto'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
