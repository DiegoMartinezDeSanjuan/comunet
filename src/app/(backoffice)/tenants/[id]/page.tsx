import { requireAuth } from '@/lib/auth'
import { getTenantDetails } from '@/modules/contacts/server/contact-service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Home, Key, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  const tenant = await getTenantDetails(id, session.officeId)

  if (!tenant) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/tenants" 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{tenant.fullName}</h1>
          <p className="text-sm text-muted-foreground mt-1">DNI/NIF: {tenant.dni || 'No especificado'}</p>
        </div>
        
        {['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role) && (
          <Link 
            href={`/tenants/${tenant.id}/edit`} 
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
              <span className="font-medium">{tenant.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{tenant.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-muted-foreground">Alta en sistema</span>
              <span className="font-medium">{tenant.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="h-5 w-5 text-muted-foreground" /> Información Interna</h2>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">Anotaciones (Privado)</span>
              <div className="p-2 border rounded min-h-[60px] whitespace-pre-wrap">{tenant.notes || 'Ninguna nota'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Home className="h-5 w-5 text-muted-foreground" /> Alquileres</h2>
          <p className="text-sm text-muted-foreground">Nota: La relación directa alquileres-unidades no está disponible aún.</p>
        </div>
      </div>
    </div>
  )
}
