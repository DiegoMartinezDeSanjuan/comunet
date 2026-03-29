import { requireAuth } from '@/lib/auth'
import { getCommunityDetails } from '@/modules/communities/server/service'
import { computeFinanceKPIs } from '@/modules/finances/server/kpi-service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, Info, FileText, ArrowLeft, Settings, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CommunityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  const community = await getCommunityDetails(id, session.officeId)

  if (!community) {
    notFound()
  }

  const financeKPIs = await computeFinanceKPIs(community.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/communities" 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{community.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ficha técnica de la comunidad
          </p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'].includes(session.role) && (
          <Link 
            href={`/communities/${community.id}/edit`} 
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Settings className="mr-2 h-4 w-4" />
            Editar
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Información General</h2>
          </div>
          <dl className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <dt className="text-muted-foreground font-medium">Nombre</dt>
              <dd className="col-span-2 text-foreground font-medium">{community.name}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <dt className="text-muted-foreground font-medium">CIF/NIF</dt>
              <dd className="col-span-2 text-foreground">{community.cif || '-'}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <dt className="text-muted-foreground font-medium">Dirección</dt>
              <dd className="col-span-2 text-foreground">{community.address || '-'}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <dt className="text-muted-foreground font-medium">Año Fiscal</dt>
              <dd className="col-span-2 text-foreground">{community.fiscalYear}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-muted-foreground font-medium">Alta en sistema</dt>
              <dd className="col-span-2 text-foreground">{community.createdAt.toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Datos Bancarios y Notas</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">IBAN de la Comunidad</p>
              <div className="rounded-md bg-muted p-3 font-mono text-sm text-foreground">
                {community.iban || 'No especificado'}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Notas</p>
              <div className="rounded-md border p-3 text-sm text-foreground min-h-[100px] whitespace-pre-wrap">
                {community.notes || 'No hay notas adicionales.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm p-6 mt-6">
         <h2 className="text-lg font-semibold mb-4">Estado Financiero (Resumen)</h2>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg border text-center">
               <p className="text-sm text-muted-foreground mb-1">Total Emitido</p>
               <p className="text-xl font-bold">{Number(financeKPIs.totalEmitido).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div className="p-4 bg-success/10 rounded-lg border border-success/20 text-center">
               <p className="text-sm text-success mb-1">Total Cobrado</p>
               <p className="text-xl font-bold text-success">{Number(financeKPIs.totalCobrado).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
               <p className="text-sm text-destructive mb-1">Deuda Pendiente</p>
               <p className="text-xl font-bold text-destructive">{Number(financeKPIs.totalPendiente).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 text-center">
               <p className="text-sm text-orange-600 mb-1">Recibos Vencidos</p>
               <p className="text-xl font-bold text-orange-600">{financeKPIs.overdueCount}</p>
            </div>
         </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm p-6 mt-6">
         <h2 className="text-lg font-semibold mb-4">Accesos de Comunidad</h2>
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={`/communities/${community.id}/units`} className="flex flex-col items-center justify-center p-6 border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors group">
              <Building2 className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="font-medium">Unidades y Edificios ({community._count.units})</span>
            </Link>
            <Link href={`/communities/${community.id}/board`} className="flex flex-col items-center justify-center p-6 border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors group">
              <Users className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="font-medium">Cargos de Junta</span>
            </Link>
            <Link href={`/communities/${community.id}/fee-rules`} className="flex flex-col items-center justify-center p-6 border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors group">
              <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="font-medium">Reglas de Cuota</span>
            </Link>
         </div>
      </div>
    </div>
  )
}
