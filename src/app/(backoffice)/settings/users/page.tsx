import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireAuth } from '@/lib/auth'
import { canManageUsers, canReadUsers } from '@/lib/permissions'
import { listUsers } from '@/modules/users/server/queries'
import { UserRole, UserStatus } from '@prisma/client'
import { CreateUserDialog, EditUserDialog, ResetPasswordDialog } from './user-dialogs'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.trunc(parsed)
}

function roleBadge(role: UserRole) {
  switch (role) {
    case 'SUPERADMIN': return <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200">Superadmin</span>
    case 'OFFICE_ADMIN': return <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">Administrador</span>
    case 'PRESIDENT': return <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">Presidente</span>
    case 'OWNER': return <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200">Propietario</span>
    case 'PROVIDER': return <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-cyan-50 text-cyan-700 border-cyan-200">Industrial</span>
    default: return role
  }
}

function statusBadge(status: UserStatus) {
  switch (status) {
    case 'ACTIVE': return <span className="text-green-600 font-medium">Activo</span>
    case 'INACTIVE': return <span className="text-muted-foreground font-medium">Inactivo</span>
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAuth()

  if (!canReadUsers(session)) {
    redirect('/settings')
  }

  const canManage = canManageUsers(session)

  const params = await searchParams
  const q = getParam(params.q)
  const role = getParam(params.role) as UserRole | ''
  const status = getParam(params.status) as UserStatus | ''
  const page = parsePositiveInt(getParam(params.page), 1)

  const result = await listUsers({
    officeId: session.officeId,
    search: q || undefined,
    role: role || undefined,
    status: status || undefined,
    page,
    pageSize: 15,
  })

  // Basic filters array
  const roles: UserRole[] = ['SUPERADMIN', 'OFFICE_ADMIN', 'PRESIDENT', 'OWNER', 'PROVIDER']
  const statuses: UserStatus[] = ['ACTIVE', 'INACTIVE']

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Usuarios del Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Gestión de roles y operadores con acceso al entorno.
          </p>
        </div>
        {canManage && <CreateUserDialog />}
      </header>

      <section className="rounded-md border border-border bg-card overflow-hidden">
        <form className="p-4 border-b bg-muted/20 flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email..."
            className="flex-1 min-w-[200px] h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
          <select
            name="role"
            defaultValue={role}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todos los roles</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Cualquier estado</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Filtrar</button>
          <Link href="/settings/users" className="h-9 px-4 rounded-md border flex items-center justify-center text-sm font-medium bg-background">Limpiar</Link>
        </form>

        <div className="overflow-x-auto">
          {result.items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No se han encontrado usuarios con estos filtros.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                  <th className="h-10 px-4 font-medium text-muted-foreground">Nombre y Contacto</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Rol</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Estado</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Vínculo</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((user) => (
                  <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="p-4 align-middle">{roleBadge(user.role)}</td>
                    <td className="p-4 align-middle">{statusBadge(user.status)}</td>
                    <td className="p-4 align-middle text-xs">
                      {user.linkedOwner ? (
                        <div className="flex flex-col"><span className="font-medium truncate max-w-[150px]">Prop: {user.linkedOwner.fullName}</span></div>
                      ) : user.linkedProvider ? (
                        <div className="flex flex-col"><span className="font-medium truncate max-w-[150px]">Prov: {user.linkedProvider.name}</span></div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="p-4 align-middle text-right flex justify-end gap-2">
                       {canManage && (
                         <>
                          <ResetPasswordDialog userId={user.id} userName={user.name} />
                          <EditUserDialog user={user} currentUserId={session.userId} />
                         </>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
