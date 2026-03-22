'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { generateReceiptsSchema, type GenerateReceiptsInput } from '@/modules/finances/schema'
import { generateReceiptsAction } from '@/modules/finances/server/actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
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
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle } from 'lucide-react'

type CommunityOption = {
  id: string
  name: string
}

type FeeRuleOption = {
  id: string
  communityId: string
  name: string
  calculationBase: string | null
  fixedAmount: number | null
}

interface FormProps {
  communities: CommunityOption[]
  feeRules: FeeRuleOption[]
}

export function GenerateReceiptsForm({ communities, feeRules }: FormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultMsg, setResultMsg] = useState<{ count: number; message: string } | null>(null)

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
    return feeRules.filter((rule) => rule.communityId === selectedCommunity)
  }, [selectedCommunity, feeRules])

  const selectedRule = useMemo(() => {
    if (!selectedRuleId) return null
    return feeRules.find((rule) => rule.id === selectedRuleId) ?? null
  }, [selectedRuleId, feeRules])

  const onSubmit = async (data: GenerateReceiptsInput) => {
    try {
      setIsSubmitting(true)
      setResultMsg(null)

      const result = await generateReceiptsAction(data)
      setResultMsg(result)

      if (result.count > 0) {
        toast({
          title: 'Generación completada',
          description: result.message,
        })

        setTimeout(() => router.push('/finance/receipts'), 2000)
        return
      }

      toast({
        title: 'Sin resultados',
        description: result.message,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron generar los recibos.'

      toast({
        title: 'Error de validación',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {resultMsg && resultMsg.count === 0 && (
          <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4 text-sm text-orange-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-orange-500" />
            <p>{resultMsg.message}</p>
          </div>
        )}

        {resultMsg && resultMsg.count > 0 && (
          <div className="flex gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{resultMsg.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="communityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comunidad</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue('feeRuleId', '', { shouldDirty: true, shouldValidate: true })
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la comunidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.name}
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
                <FormLabel>Regla de cuota activa</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={!selectedCommunity || filteredRules.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedCommunity
                            ? 'Selecciona comunidad primero'
                            : filteredRules.length === 0
                              ? 'No hay reglas activas'
                              : 'Selecciona una regla'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredRules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.name} ({rule.calculationBase ?? 'SIN BASE'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedRule && (
                  <FormDescription>
                    Base: {selectedRule.calculationBase ?? 'SIN BASE'} — Fijo/Total:{' '}
                    {selectedRule.fixedAmount != null
                      ? selectedRule.fixedAmount.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })
                      : '—'}
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
                <FormLabel>Inicio periodo facturado</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fin periodo facturado</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
                <FormLabel>Fecha de emisión</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de vencimiento / pago límite</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Generando...' : 'Generar recibos'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
