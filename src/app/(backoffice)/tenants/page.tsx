import { requireAuth } from '@/lib/auth'
import { getTenants } from '@/modules/contacts/server/contact-service'
import { Search, Users, Plus, Mail, Phone, UserCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await requireAuth()
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''

  const tenants = await getTenants(session.officeId, query)
  const canManage = ['SUPERADMIN', 'OFFICE_ADMIN'].includes(session.role)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inquilinos</h1>
          <p className="text-sm text-muted-foreground mt-1">Diccionario global de inquilinos del despacho.</p>
        </div>

        {canManage && (
          <Link
            href="/tenants/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Nuevo Inquilino
          </Link>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{tenants.length}</p>
            <p className="text-xs text-muted-foreground">Inquilinos registrados</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{tenants.filter(t => t.email).length}</p>
            <p className="text-xs text-muted-foreground">Con email de contacto</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre, DNI, o email..."
          className="h-10 w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/10">
                <th className="h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inquilino</th>
                <th className="h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">DNI/NIF</th>
                <th className="h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contacto</th>
                <th className="h-11 px-5 text-right align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <UserCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No se encontraron inquilinos.</p>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-border/30 transition-colors hover:bg-muted/10">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-400 text-xs font-bold">
                          {tenant.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-foreground">{tenant.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="font-mono text-xs bg-muted/20 px-2 py-0.5 rounded">{tenant.dni || '-'}</span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col gap-0.5">
                        {tenant.email && (
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {tenant.email}
                          </span>
                        )}
                        {tenant.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </span>
                        )}
                        {!tenant.email && !tenant.phone && <span className="text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link
                        href={`/tenants/${tenant.id}/edit`}
                        className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        Editar
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
