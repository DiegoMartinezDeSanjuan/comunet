import { requireAuth } from '@/lib/auth'
import { getOwnerDetails } from '@/modules/contacts/server/contact-service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Home, Key, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OwnerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  const owner = await getOwnerDetails(id, session.officeId)

  if (!owner) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/owners" 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{owner.fullName}</h1>
          <p className="text-sm text-muted-foreground mt-1">DNI/NIF: {owner.dni || 'No especificado'}</p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'].includes(session.role) && (
          <Link 
            href={`/owners/${owner.id}/edit`} 
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar Ficha
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground" /> Contacto</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium">{owner.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{owner.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Dirección</span>
              <span className="font-medium text-right max-w-[200px] truncate" title={owner.address || ''}>{owner.address || '-'}</span>
            </div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-muted-foreground">Alta en sistema</span>
              <span className="font-medium">{owner.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="h-5 w-5 text-muted-foreground" /> Información Financiera e Interna</h2>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">Anotaciones (Privado)</span>
              <div className="p-2 border rounded min-h-[60px] whitespace-pre-wrap">{owner.notes || 'Ninguna nota'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Home className="h-5 w-5 text-muted-foreground" /> Propiedades Vinculadas</h2>
          <p className="text-sm text-muted-foreground">Unidades de las cuales este contacto es propietario</p>
        </div>
        <div className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Comunidad</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Edificio</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Unidad</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Titularidad</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Contacto Bill</th>
              </tr>
            </thead>
            <tbody>
              {owner.ownerships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">Este propietario no tiene unidades asociadas aún.</td>
                </tr>
              ) : (
                owner.ownerships.map((own: any) => (
                  <tr key={own.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 font-medium"><Link href={`/communities/${own.unit.communityId}`} className="hover:underline">{own.unit.community.name}</Link></td>
                    <td className="p-4">{own.unit.building?.name || '-'}</td>
                    <td className="p-4 font-semibold text-primary"><Link href={`/communities/${own.unit.communityId}/units`} className="hover:underline">{own.unit.reference}</Link></td>
                    <td className="p-4 text-right">{own.ownershipPercent.toString()}%</td>
                    <td className="p-4 text-center">{own.isPrimaryBillingContact ? '✅' : '-'}</td>
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
