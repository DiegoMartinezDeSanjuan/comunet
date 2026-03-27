import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { AuditAction } from '@prisma/client'

import { requireAuth } from '@/lib/auth'
import { canReadAudit } from '@/lib/permissions'
import { listAuditLogs, getAuditEntityTypes } from '@/modules/audit/server/queries'

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

function actionBadge(action: AuditAction) {
  switch (action) {
    case 'CREATE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-green-700 bg-green-100 uppercase">CREATE</span>
    case 'UPDATE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-blue-700 bg-blue-100 uppercase">UPDATE</span>
    case 'DELETE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-red-700 bg-red-100 uppercase">DELETE</span>
    case 'ARCHIVE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-orange-700 bg-orange-100 uppercase">ARCHIVE</span>
    case 'STATUS_CHANGE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-purple-700 bg-purple-100 uppercase">STATUS</span>
    case 'LOGIN': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-slate-700 bg-slate-100 uppercase">LOGIN</span>
    case 'LOGOUT': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-slate-700 bg-slate-100 uppercase">LOGOUT</span>
    default: return action
  }
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAuth()

  if (!canReadAudit(session)) {
    redirect('/settings')
  }

  const params = await searchParams
  const action = getParam(params.action) as AuditAction | ''
  const entityType = getParam(params.entityType)
  const page = parsePositiveInt(getParam(params.page), 1)

  const [result, availableEntityTypes] = await Promise.all([
    listAuditLogs({
      officeId: session.officeId,
      action: action || undefined,
      entityType: entityType || undefined,
      page,
      pageSize: 30,
    }),
    getAuditEntityTypes(session.officeId)
  ])

  const actions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT']

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Registro de Auditoría</h2>
        <p className="text-sm text-muted-foreground">
          Trazabilidad de operaciones críticas en el sistema.
        </p>
      </header>

      <section className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
        <form className="p-4 border-b bg-muted/20 flex flex-wrap gap-3 items-center">
          <select
            name="action"
            defaultValue={action}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Cualquier acción</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            name="entityType"
            defaultValue={entityType}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm min-w-[150px]"
          >
            <option value="">Cualquier entidad</option>
            {availableEntityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Filtrar</button>
          <Link href="/settings/audit" className="h-9 px-4 rounded-md border flex items-center justify-center text-sm font-medium bg-background">Limpiar</Link>
        </form>

        <div className="overflow-x-auto">
          {result.items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay registros de auditoría que coincidan con los filtros.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b transition-colors bg-muted/10">
                  <th className="h-10 px-4 font-medium text-muted-foreground whitespace-nowrap">Fecha y Hora</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Operador</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Acción</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Entidad</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground w-1/3">Metadatos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4 align-top whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('es-ES', { 
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit', second: '2-digit' 
                      })}
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-foreground">{log.user.name}</div>
                      <div className="text-xs text-muted-foreground">{log.user.email}</div>
                    </td>
                    <td className="p-4 align-top">
                      {actionBadge(log.action)}
                    </td>
                    <td className="p-4 align-top font-mono text-xs">
                      <div><span className="text-muted-foreground select-none">Tipo: </span>{log.entityType}</div>
                      <div><span className="text-muted-foreground select-none">ID: </span><span title={log.entityId}>{log.entityId.slice(-8)}...</span></div>
                    </td>
                    <td className="p-4 align-top">
                       {log.metaJson ? (
                         <pre className="text-[10px] text-muted-foreground bg-muted p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                           {log.metaJson}
                         </pre>
                       ) : <span className="text-xs text-muted-foreground">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination basics */}
        {result.totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center bg-muted/5">
            <span className="text-xs text-muted-foreground">
              Página {result.page} de {result.totalPages} ({result.total} registros)
            </span>
            <div className="flex gap-2 text-sm">
              {result.page > 1 && (
                <Link 
                  href={`/settings/audit?page=${result.page - 1}${action ? `&action=${action}` : ''}${entityType ? `&entityType=${entityType}` : ''}`} 
                  className="px-3 py-1 border rounded bg-background hover:bg-muted"
                >
                  Anterior
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link 
                  href={`/settings/audit?page=${result.page + 1}${action ? `&action=${action}` : ''}${entityType ? `&entityType=${entityType}` : ''}`} 
                  className="px-3 py-1 border rounded bg-background hover:bg-muted"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
