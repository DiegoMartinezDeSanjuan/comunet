import { getCommunityUnitOwnershipPageQuery } from '@/modules/communities/server/queries'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Key } from 'lucide-react'
import { OwnershipForm } from './ownership-form'

export const dynamic = 'force-dynamic'

export default async function UnitOwnershipPage({
  params,
}: {
  params: Promise<{ id: string, unitId: string }>
}) {
  const { id, unitId } = await params

  let result
  try {
    result = await getCommunityUnitOwnershipPageQuery(id, unitId)
  } catch (e: any) {
    if (e?.message === 'FORBIDDEN') redirect('/communities')
    throw e
  }

  if (!result) notFound()

  const { unit, allOwners } = result

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/communities/${id}/units`} 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Titulares de la Unidad: {unit.reference}</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona los propietarios asociados a esta propiedad</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="h-5 w-5" /> Cuadro de Titularidad Actual</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Propietario / Titular</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">% Propiedad</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Rep. Facturación</th>
              </tr>
            </thead>
            <tbody>
              {unit.ownerships.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground">Unidad sin propietario registrado.</td>
                </tr>
              ) : (
                unit.ownerships.map((own: any) => (
                  <tr key={own.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4">
                      <Link href={`/owners/${own.ownerId}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                        <User className="h-4 w-4" /> {own.owner.fullName}
                      </Link>
                    </td>
                    <td className="p-4 text-center">{own.ownershipPercent}%</td>
                    <td className="p-4 text-center">{own.isPrimaryBillingContact ? '✅ Principal' : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4 self-start">
          <h2 className="text-lg font-semibold">Vincular Propietario</h2>
          <OwnershipForm unitId={unit.id} owners={allOwners.map((o: any) => ({id: o.id, fullName: o.fullName}))} />
        </div>
      </div>
    </div>
  )
}
