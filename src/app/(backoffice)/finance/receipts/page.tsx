import { requireAuth } from '@/lib/auth'
import { findReceiptsByOffice } from '@/modules/finances/server/receipt-repository'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReceiptsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const session = await requireAuth()
  const params = await searchParams
  
  // Basic filtering config
  const filters = {
    communityId: params.communityId,
    status: params.status,
  }

  const receipts = await findReceiptsByOffice(session.officeId, filters)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recibos Emitidos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión global de facturación y cuotas
          </p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(session.role) && (
          <div className="flex gap-2">
            <Link 
              href="/finance/receipts/generate" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generar Recibos
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/20">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Comunidad</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Referencia</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Emisión</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Importe</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Cobrado</th>
                <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Estado</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay recibos emitidos registrados.
                  </td>
                </tr>
              ) : (
                receipts.map((r: any) => (
                  <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{r.community.name}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{r.reference}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {new Date(r.issueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle text-right font-medium">
                      {Number(r.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="p-4 align-middle text-right">
                      {Number(r.paidAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        r.status === 'PAID' ? 'bg-success/20 text-success border-success/20' : 
                        r.status === 'PARTIALLY_PAID' ? 'bg-cyan-500/20 text-cyan-600 border-cyan-500/20' : 
                        r.status === 'OVERDUE' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        r.status === 'RETURNED' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                        r.status === 'CANCELLED' ? 'bg-muted text-muted-foreground opacity-70' :
                        'bg-accent text-accent-foreground border-border'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link 
                        href={`/finance/receipts/${r.id}`}
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
