import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { parseMeetingStatus, parseMeetingType } from '@/modules/meetings/schema'
import { listMeetingCommunitiesQuery, listMeetingsQuery } from '@/modules/meetings/server/queries'
import { MeetingCreateForm } from './meeting-create-form'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  HELD: 'Celebrada',
  CLOSED: 'Cerrada',
}

const TYPE_LABELS: Record<string, string> = {
  ORDINARY: 'Ordinaria',
  EXTRAORDINARY: 'Extraordinaria',
}

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

function formatDateTime(value: Date): string {
  return new Date(value).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function badgeClasses(value: string): string {
  switch (value) {
    case 'CLOSED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'HELD':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'SCHEDULED':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-border bg-slate-50 text-muted-foreground'
  }
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'meetings.read')) {
    throw new Error('FORBIDDEN')
  }

  const params = await searchParams
  const q = getParam(params.q)
  const communityId = getParam(params.communityId)
  const status = parseMeetingStatus(getParam(params.status))
  const meetingType = parseMeetingType(getParam(params.meetingType))
  const timeframe = getParam(params.timeframe)
  const page = parsePositiveInt(getParam(params.page), 1)
  const pageSize = 20

  const [result, communities] = await Promise.all([
    listMeetingsQuery(
      {
        search: q || undefined,
        communityId: communityId || undefined,
        status,
        meetingType,
        timeframe: timeframe === 'upcoming' || timeframe === 'past' ? timeframe : undefined,
      },
      { page, pageSize },
    ),
    listMeetingCommunitiesQuery(),
  ])

  const canManage = requirePermission(session, 'meetings.manage')
  const startItem = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const endItem = result.total === 0 ? 0 : Math.min(result.page * result.pageSize, result.total)

  const buildHref = (targetPage: number) => {
    const query = new URLSearchParams()
    if (q) query.set('q', q)
    if (communityId) query.set('communityId', communityId)
    if (status) query.set('status', status)
    if (meetingType) query.set('meetingType', meetingType)
    if (timeframe) query.set('timeframe', timeframe)
    if (targetPage > 1) query.set('page', String(targetPage))
    const search = query.toString()
    return search ? `/meetings?${search}` : '/meetings'
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reuniones</h1>
          <p className="text-muted-foreground">
            Gestión del calendario de juntas, orden del día y actas mínimas desde backoffice.
          </p>
        </div>
      </header>

      {canManage ? <MeetingCreateForm communities={communities} /> : null}

      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="meetings-list-card">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Listado</h2>
          <p className="text-sm text-muted-foreground">
            Mostrando {startItem}-{endItem} de {result.total} reuniones.
          </p>
        </div>

        <form className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="meetings-search" className="text-sm font-medium">
              Buscar
            </label>
            <input
              id="meetings-search"
              name="q"
              defaultValue={q}
              placeholder="Título, descripción o comunidad"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="meetings-community" className="text-sm font-medium">
              Comunidad
            </label>
            <select
              id="meetings-community"
              name="communityId"
              defaultValue={communityId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meetings-status" className="text-sm font-medium">
              Estado
            </label>
            <select
              id="meetings-status"
              name="status"
              defaultValue={status ?? ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meetings-type" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="meetings-type"
              name="meetingType"
              defaultValue={meetingType ?? ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meetings-timeframe" className="text-sm font-medium">
              Marco temporal
            </label>
            <select
              id="meetings-timeframe"
              name="timeframe"
              defaultValue={timeframe}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="upcoming">Próximas</option>
              <option value="past">Pasadas</option>
            </select>
          </div>

          <div className="flex items-end gap-2 md:col-span-5">
            <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Filtrar
            </button>
            <Link
              href="/meetings"
              className="inline-flex h-10 items-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Limpiar
            </Link>
          </div>
        </form>

        {result.items.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No se han encontrado reuniones con esos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Reunión</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Comunidad</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Orden del día</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Acta</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((meeting) => {
                  const minute = meeting.minutes[0] ?? null
                  return (
                    <tr key={meeting.id} data-testid={`meeting-row-${meeting.id}`}>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{meeting.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {meeting.location || 'Sin ubicación definida'}
                        </div>
                      </td>
                      <td className="p-4 align-middle">{meeting.community.name}</td>
                      <td className="p-4 align-middle">{formatDateTime(meeting.scheduledAt)}</td>
                      <td className="p-4 align-middle">{TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${badgeClasses(meeting.status)}`}>
                          {STATUS_LABELS[meeting.status] ?? meeting.status}
                        </span>
                      </td>
                      <td className="p-4 align-middle">{meeting._count.agendaItems}</td>
                      <td className="p-4 align-middle">{minute ? minute.status : 'Sin acta'}</td>
                      <td className="p-4 align-middle">
                        <Link href={`/meetings/${meeting.id}`} className="text-primary underline-offset-4 hover:underline">
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <span>
            Página {result.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {result.hasPreviousPage ? (
              <Link className="rounded-md border px-3 py-2" href={buildHref(result.page - 1)}>
                Anterior
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-2 text-muted-foreground">Anterior</span>
            )}

            {result.hasNextPage ? (
              <Link className="rounded-md border px-3 py-2" href={buildHref(result.page + 1)}>
                Siguiente
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-2 text-muted-foreground">Siguiente</span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
