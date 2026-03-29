import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { parseMeetingStatus, parseMeetingType } from '@/modules/meetings/schema'
import { listMeetingCommunitiesQuery, listMeetingsQuery } from '@/modules/meetings/server/queries'
import { MeetingCreateForm } from './meeting-create-form'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, Filter, Search, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  HELD: 'Celebrada',
  CLOSED: 'Cerrada',
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  SCHEDULED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HELD: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  CLOSED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
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

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function getDateParts(value: Date) {
  const d = new Date(value)
  return {
    month: MONTH_NAMES[d.getMonth()] ?? '',
    day: d.getDate(),
    time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
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

  const scheduledCount = result.items.filter(m => m.status === 'SCHEDULED').length
  const withMinutes = result.items.filter(m => m.minutes.length > 0).length

  // Find next upcoming meeting
  const now = new Date()
  const upcomingMeeting = result.items.find(m => new Date(m.scheduledAt) > now)
  const daysUntilNext = upcomingMeeting
    ? Math.ceil((new Date(upcomingMeeting.scheduledAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const hasFilters = q || communityId || status || meetingType || timeframe

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

  const pillClass = "inline-flex h-9 items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-3 text-sm hover:border-border transition-colors"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reuniones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión del calendario de juntas, orden del día y actas desde backoffice.
          </p>
        </div>
      </div>

      {/* KPI Row - 2+2 grid with mini-calendar card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{result.total}</p>
            <p className="text-xs text-muted-foreground">Total reuniones</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{scheduledCount}</p>
            <p className="text-xs text-muted-foreground">Programadas</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{withMinutes}</p>
            <p className="text-xs text-muted-foreground">Con acta</p>
          </div>
        </div>
        {/* Next Meeting Countdown */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
          <p className="text-xs text-muted-foreground mb-1">Próxima Reunión</p>
          {upcomingMeeting ? (
            <>
              <p className="text-base font-semibold text-foreground">
                {daysUntilNext === 0 ? 'Hoy' : daysUntilNext === 1 ? 'Mañana' : `${daysUntilNext} días`}
              </p>
              <p className="text-xs text-primary mt-0.5 truncate">{upcomingMeeting.title}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin reuniones próximas</p>
          )}
        </div>
      </div>

      {canManage ? <MeetingCreateForm communities={communities} /> : null}

      {/* Filter Pills Bar */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar..."
            className="h-9 w-48 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
        <select name="communityId" defaultValue={communityId} className={pillClass}>
          <option value="">Comunidad</option>
          {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ''} className={pillClass}>
          <option value="">Estado</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="meetingType" defaultValue={meetingType ?? ''} className={pillClass}>
          <option value="">Tipo</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="timeframe" defaultValue={timeframe} className={pillClass}>
          <option value="">Todas</option>
          <option value="upcoming">Próximas</option>
          <option value="past">Pasadas</option>
        </select>
        <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/meetings" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/50 px-3 text-sm hover:bg-muted/20 transition-colors">
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Link>
        )}
      </form>

      {/* Timeline Cards */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1 mb-3">
          <p className="text-xs text-muted-foreground">
            Mostrando {startItem}-{endItem} de {result.total} reuniones
          </p>
        </div>

        {result.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/30 p-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No se han encontrado reuniones con esos filtros.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {result.items.map((meeting) => {
              const dateParts = getDateParts(meeting.scheduledAt)
              const minute = meeting.minutes[0] ?? null
              return (
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-card/80"
                >
                  {/* Date Block */}
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-center">
                    <span className="text-[10px] font-bold uppercase text-primary leading-none">{dateParts.month}</span>
                    <span className="text-xl font-bold text-foreground leading-tight">{dateParts.day}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {meeting.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {meeting.community.name} · {meeting.location || 'Sin ubicación'} · {dateParts.time}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[meeting.status] ?? ''}`}>
                      {STATUS_LABELS[meeting.status] ?? meeting.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      {meeting._count.agendaItems}
                    </span>
                    {minute && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Acta
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 text-sm">
          <span className="text-muted-foreground">Página {result.page} de {result.totalPages}</span>
          <div className="flex gap-1">
            {result.hasPreviousPage ? (
              <Link href={buildHref(result.page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"><ChevronLeft className="h-4 w-4" /></Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40"><ChevronLeft className="h-4 w-4" /></span>
            )}
            {result.hasNextPage ? (
              <Link href={buildHref(result.page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"><ChevronRight className="h-4 w-4" /></Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40"><ChevronRight className="h-4 w-4" /></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
