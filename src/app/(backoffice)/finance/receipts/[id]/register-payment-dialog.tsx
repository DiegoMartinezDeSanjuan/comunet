'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentSchema, type PaymentInput } from '@/modules/finances/schema'
import { registerPaymentAction } from '@/modules/finances/server/actions'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { CreditCard } from 'lucide-react'

export function RegisterPaymentDialog({ receiptId, maxAmount }: { receiptId: string, maxAmount: number }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      receiptId,
      amount: maxAmount,
      method: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().substring(0, 10),
      reference: '',
      notes: ''
    },
  })

  // Keep amount synced if modal is opened/closed
  const handleOpen = (val: boolean) => {
    setOpen(val)
    if (val) form.setValue('amount', maxAmount)
  }

  const onSubmit = async (data: PaymentInput) => {
    try {
      setIsSubmitting(true)
      await registerPaymentAction(data)
      toast({ title: 'Pago registrado con éxito' })
      setOpen(false)
      form.reset()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CreditCard className="mr-2 h-4 w-4" />
          Registrar Pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pago Recibido</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importe a registrar (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        max={maxAmount + 0.01}
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
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del pago</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Transferencia</SelectItem>
                      <SelectItem value="DIRECT_DEBIT">Domiciliación</SelectItem>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="CHECK">Cheque</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia Bancaria (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. TRF-12345" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Confirmar Pago'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
