import { redirect } from 'next/navigation'
import { getReceiptGenerationFormDataQuery } from '@/modules/finances/server/queries'
import { GenerateReceiptsForm } from './generate-receipts-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GenerateReceiptsPage() {
  const { communities, feeRules } = await getReceiptGenerationFormDataQuery()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/finance/receipts"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Generación Masiva de Recibos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Emite recibos para todos los propietarios basándote en una regla de cuota.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <GenerateReceiptsForm communities={communities} feeRules={feeRules} />
      </div>
    </div>
  )
}
