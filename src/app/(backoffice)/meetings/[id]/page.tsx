import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/permissions'
import { getMeetingDetailQuery } from '@/modules/meetings/server/queries'
import { MeetingDetailActions } from './meeting-detail-actions'
import { AgendaListInteractive } from './agenda-list-interactive'
import { AttendanceListInteractive } from './attendance-list-interactive'

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



function formatDateTime(value: Date): string {
  return new Date(value).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getMeetingDetailQuery(id)

  if (!result.meeting) {
    notFound()
  }

  const { meeting, session } = result
  const latestMinute = meeting.minutes[0] ?? null
  const canManage = requirePermission(session, 'meetings.manage')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/meetings" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Volver a reuniones
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
          <p className="text-muted-foreground">
            {meeting.community.name} · {TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType} ·{' '}
            {STATUS_LABELS[meeting.status] ?? meeting.status}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Fecha y hora</div>
          <div className="mt-1 text-lg font-semibold">{formatDateTime(meeting.scheduledAt)}</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Ubicación</div>
          <div className="mt-1 text-lg font-semibold">{meeting.location || 'Pendiente'}</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Puntos del orden del día</div>
          <div className="mt-1 text-lg font-semibold">{meeting.agendaItems.length}</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Acta</div>
          <div className="mt-1 text-lg font-semibold">{latestMinute ? latestMinute.status : 'Sin acta'}</div>
        </div>
      </section>

      {canManage ? (
        <MeetingDetailActions
          meeting={{
            id: meeting.id,
            title: meeting.title,
            meetingType: meeting.meetingType,
            scheduledAt: meeting.scheduledAt.toISOString(),
            location: meeting.location ?? '',
            description: meeting.description ?? '',
            status: meeting.status,
          }}
          latestMinute={
            latestMinute
              ? {
                  id: latestMinute.id,
                  content: latestMinute.content ?? '',
                  status: latestMinute.status,
                }
              : null
          }
        />
      ) : null}

      <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="meeting-agenda-list-card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Orden del día</h2>
          <p className="text-sm text-muted-foreground">
            Puntos registrados para la reunión, con votos vinculados si ya se han cargado.
          </p>
        </div>

        <AgendaListInteractive 
          meetingId={meeting.id}
          canManage={canManage}
          isClosed={meeting.status === 'CLOSED'}
          items={meeting.agendaItems}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="meeting-attendance-card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Asistencia</h2>
            <p className="text-sm text-muted-foreground">
              Relación de asistentes cargados y tipo de presencia o representación.
            </p>
          </div>

          <AttendanceListInteractive
            meetingId={meeting.id}
            canManage={canManage}
            isClosed={meeting.status === 'CLOSED'}
            attendances={meeting.attendances}
          />
        </section>

        <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm" data-testid="meeting-minute-preview-card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Última acta</h2>
            <p className="text-sm text-muted-foreground">
              Vista previa del borrador o acta más reciente vinculada a la reunión.
            </p>
          </div>

          {latestMinute ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Estado: <span className="font-medium text-foreground">{latestMinute.status}</span>
              </div>
              <div className="rounded-md border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
                {latestMinute.content || 'Sin contenido todavía.'}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Esta reunión aún no tiene acta registrada.
            </div>
          )}
        </section>
      </section>
    </div>
  )
}
