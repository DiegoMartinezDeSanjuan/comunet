import { getReceiptDetailQuery } from '@/modules/finances/server/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Building2, Calendar, Euro } from 'lucide-react'
import { RegisterPaymentDialog } from './register-payment-dialog'

export const dynamic = 'force-dynamic'

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const result = await getReceiptDetailQuery(id)
  if (!result) {
    notFound()
  }

  const { receipt, session } = result

  const isPayable = receipt.status === 'ISSUED' || receipt.status === 'PARTIALLY_PAID' || receipt.status === 'OVERDUE' || receipt.status === 'RETURNED'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/finance/receipts" 
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Recibo {receipt.reference}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                receipt.status === 'PAID' ? 'bg-success/20 text-success border-success/20' : 
                receipt.status === 'PARTIALLY_PAID' ? 'bg-cyan-500/20 text-cyan-600 border-cyan-500/20' : 
                receipt.status === 'OVERDUE' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                receipt.status === 'RETURNED' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                receipt.status === 'CANCELLED' ? 'bg-muted text-muted-foreground opacity-70' :
                'bg-accent text-accent-foreground border-border'
              }`}>
                {receipt.status}
              </span>
              <p className="text-sm text-muted-foreground">
                {receipt.community.name}
              </p>
            </div>
          </div>
        </div>
        
        {isPayable && ['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role) && (
          <div className="flex gap-2">
            <RegisterPaymentDialog receiptId={receipt.id} maxAmount={Number(receipt.amount) - Number(receipt.paidAmount)} />
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Datos del Recibo</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Importe Total</dt>
              <dd className="font-semibold text-lg">{Number(receipt.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Importe Pagado</dt>
              <dd className="font-medium text-success">{Number(receipt.paidAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fecha de Emisión</dt>
              <dd className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {new Date(receipt.issueDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fecha Vencimiento</dt>
              <dd className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {new Date(receipt.dueDate).toLocaleDateString()}
              </dd>
            </div>
            <div className="col-span-2 mt-2">
              <dt className="text-muted-foreground">Periodo Facturado</dt>
              <dd className="font-medium bg-muted p-2 rounded-md mt-1 border">
                {new Date(receipt.periodStart).toLocaleDateString()} al {new Date(receipt.periodEnd).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Destinatario</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unidad</p>
                <p className="font-semibold">{receipt.unit.reference} ({receipt.unit.type})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Propietario</p>
                <p className="font-semibold">{receipt.owner.fullName}</p>
                <p className="text-sm text-muted-foreground">{receipt.owner.email || 'Sin email'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {receipt.payments.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Euro className="h-5 w-5" /> 
            Historial de Pagos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Método</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Importe</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Referencia / Notas</th>
                </tr>
              </thead>
              <tbody>
                {receipt.payments.map((p: any) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="p-4"><span className="bg-muted px-2 py-1 rounded-md text-xs">{p.method}</span></td>
                    <td className="p-4 text-right font-semibold text-success">
                      +{Number(p.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{p.reference || p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
