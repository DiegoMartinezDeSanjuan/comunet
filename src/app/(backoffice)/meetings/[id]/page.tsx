import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { getMeetingDetailQuery } from '@/modules/meetings/server/queries'
import { MeetingDetailActions } from './meeting-detail-actions'

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

const ATTENDANCE_TYPE_LABELS: Record<string, string> = {
  IN_PERSON: 'Presencial',
  DELEGATED: 'Delegada',
  REMOTE: 'Remota',
}

const VOTE_LABELS: Record<string, string> = {
  FOR: 'A favor',
  AGAINST: 'En contra',
  ABSTAIN: 'Abstención',
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
  const session = await requireAuth()
  if (!requirePermission(session, 'meetings.read')) {
    throw new Error('FORBIDDEN')
  }

  const { id } = await params
  const meeting = await getMeetingDetailQuery(id)

  if (!meeting) {
    notFound()
  }

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
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Fecha y hora</div>
          <div className="mt-1 text-lg font-semibold">{formatDateTime(meeting.scheduledAt)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Ubicación</div>
          <div className="mt-1 text-lg font-semibold">{meeting.location || 'Pendiente'}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Puntos del orden del día</div>
          <div className="mt-1 text-lg font-semibold">{meeting.agendaItems.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
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

      <section className="rounded-lg border bg-white p-6 shadow-sm" data-testid="meeting-agenda-list-card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Orden del día</h2>
          <p className="text-sm text-muted-foreground">
            Puntos registrados para la reunión, con votos vinculados si ya se han cargado.
          </p>
        </div>

        {meeting.agendaItems.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            Todavía no se han definido puntos para esta reunión.
          </div>
        ) : (
          <div className="space-y-4">
            {meeting.agendaItems.map((item) => (
              <article key={item.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">
                      {item.sortOrder}. {item.title}
                    </h3>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.votes.length} votos</span>
                </div>

                {item.votes.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="px-2 py-2 font-medium">Titular</th>
                          <th className="px-2 py-2 font-medium">Unidad</th>
                          <th className="px-2 py-2 font-medium">Voto</th>
                          <th className="px-2 py-2 font-medium">Coeficiente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {item.votes.map((vote) => (
                          <tr key={vote.id}>
                            <td className="px-2 py-2">{vote.owner?.fullName || '-'}</td>
                            <td className="px-2 py-2">{vote.unit?.reference || '-'}</td>
                            <td className="px-2 py-2">{VOTE_LABELS[vote.vote] ?? vote.vote}</td>
                            <td className="px-2 py-2">{String(vote.coefficientWeight)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-6 shadow-sm" data-testid="meeting-attendance-card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Asistencia</h2>
            <p className="text-sm text-muted-foreground">
              Relación de asistentes cargados y tipo de presencia o representación.
            </p>
          </div>

          {meeting.attendances.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Aún no hay asistentes registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Asistente</th>
                    <th className="px-2 py-2 font-medium">Titular</th>
                    <th className="px-2 py-2 font-medium">Unidad</th>
                    <th className="px-2 py-2 font-medium">Tipo</th>
                    <th className="px-2 py-2 font-medium">Coeficiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {meeting.attendances.map((attendance) => (
                    <tr key={attendance.id}>
                      <td className="px-2 py-2">{attendance.attendeeName}</td>
                      <td className="px-2 py-2">{attendance.owner?.fullName || '-'}</td>
                      <td className="px-2 py-2">{attendance.unit?.reference || '-'}</td>
                      <td className="px-2 py-2">
                        {ATTENDANCE_TYPE_LABELS[attendance.attendanceType] ?? attendance.attendanceType}
                      </td>
                      <td className="px-2 py-2">{String(attendance.coefficientPresent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-white p-6 shadow-sm" data-testid="meeting-minute-preview-card">
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
