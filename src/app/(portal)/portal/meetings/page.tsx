import { redirect } from 'next/navigation'
import { CalendarDays, Clock3, ShieldCheck } from 'lucide-react'

import {
  MEETING_STATUS_LABELS,
  PortalBadge,
  PortalEmptyState,
  PortalPageHeader,
  PortalStatCard,
} from '@/components/portal/ui'
import { requireAuth } from '@/lib/auth'
import { formatDateTime } from '@/lib/formatters'
import { listPortalMeetings } from '@/modules/portal/server/content'

function getMeetingStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'SCHEDULED') return 'info'
  if (status === 'HELD' || status === 'CLOSED') return 'success'
  return 'neutral'
}

export default async function PortalMeetingsPage() {
  const session = await requireAuth()

  if (session.role === 'PROVIDER') {
    redirect('/portal')
  }

  const meetings = await listPortalMeetings(session, 24)
  const now = new Date()
  const upcomingCount = meetings.filter((meeting) => meeting.scheduledAt >= now).length
  const withMinutesCount = meetings.filter((meeting) => meeting.minutes.length > 0).length

  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Portal"
        title="Reuniones"
        description="Consulta convocatorias y reuniones visibles en tus comunidades. Esta vista es de lectura y prioriza claridad sobre amplitud artificial."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard
          label="Reuniones visibles"
          value={String(meetings.length)}
          hint="Convocatorias no borrador dentro de tu alcance portal."
          icon={CalendarDays}
        />
        <PortalStatCard
          label="Próximas"
          value={String(upcomingCount)}
          hint="Reuniones futuras ya publicadas en tus comunidades."
          icon={Clock3}
        />
        <PortalStatCard
          label="Con acta asociada"
          value={String(withMinutesCount)}
          hint="Solo informativo. La edición de actas sigue fuera del portal."
          icon={ShieldCheck}
        />
      </div>

      {meetings.length > 0 ? (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <article key={meeting.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{meeting.title}</h2>
                    <PortalBadge tone={getMeetingStatusTone(meeting.status)}>
                      {MEETING_STATUS_LABELS[meeting.status] ?? meeting.status}
                    </PortalBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{meeting.community.name}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {meeting.scheduledAt >= now ? 'Próxima reunión' : 'Reunión celebrada'}
                </div>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Fecha y hora</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{formatDateTime(meeting.scheduledAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Ubicación</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{meeting.location || 'Pendiente de concretar'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{meeting.meetingType}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Acta</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {meeting.minutes.length > 0 ? meeting.minutes[0]?.status ?? 'Disponible' : 'Sin acta publicada'}
                  </dd>
                </div>
              </dl>

              {meeting.description ? (
                <p className="mt-4 text-sm leading-6 text-foreground">{meeting.description}</p>
              ) : null}

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                La participación, delegaciones, votaciones y edición completa de documentación de junta siguen fuera del portal en este slice. Aquí solo se muestra información de lectura con alcance validado.
              </p>
            </article>
          ))}
        </div>
      ) : (
        <PortalEmptyState
          title="No hay reuniones visibles para tus comunidades"
          description="Cuando exista una convocatoria publicada o una reunión cerrada visible para propietarios, aparecerá aquí con su fecha y estado. Mientras tanto, el portal evita placeholders vacíos y deja claro que la experiencia sigue en modo lectura mínima."
        />
      )}
    </div>
  )
}
