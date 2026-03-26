import Link from 'next/link'

import { listMyNotificationsQuery } from '@/modules/notifications/server/queries'

import { MarkNotificationReadButton } from './mark-notification-read-button'

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

function formatDateTime(value: Date | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-ES')
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const status = getParam(params.status)
  const page = parsePositiveInt(getParam(params.page), 1)

  const result = await listMyNotificationsQuery(
    {
      status:
        status === 'PENDING' ||
        status === 'SENT' ||
        status === 'READ' ||
        status === 'FAILED'
          ? status
          : undefined,
    },
    { page, pageSize: 20 },
  )

  const buildHref = (targetPage: number) => {
    const query = new URLSearchParams()

    if (status) query.set('status', status)
    if (targetPage > 1) query.set('page', String(targetPage))

    const search = query.toString()
    return search ? `/notifications?${search}` : '/notifications'
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
        <p className="text-sm text-muted-foreground">
          Bandeja minima in-app para incidencias y eventos internos.
        </p>
      </header>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Bandeja</h2>
            <p className="text-sm text-muted-foreground">
              {result.total} notificaciones en total.
            </p>
          </div>
        </div>

        <form className="mb-6 flex flex-wrap items-center gap-3">
          <select
            name="status"
            defaultValue={status}
            className="flex h-10 min-w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">PENDING</option>
            <option value="SENT">SENT</option>
            <option value="READ">READ</option>
            <option value="FAILED">FAILED</option>
          </select>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Filtrar
          </button>

          <Link
            href="/notifications"
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
          >
            Limpiar
          </Link>
        </form>

        {result.items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay notificaciones para esos filtros.
          </div>
        ) : (
          <div className="space-y-3">
            {result.items.map((notification) => (
              <article
                key={notification.id}
                className="rounded-lg border p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{notification.title}</h3>
                      <span className="rounded-full border px-2 py-1 text-xs font-medium">
                        {notification.status}
                      </span>
                      <span className="rounded-full border px-2 py-1 text-xs font-medium text-muted-foreground">
                        {notification.channel}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.body || 'Sin cuerpo adicional.'}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Creada: {formatDateTime(notification.createdAt)}
                      {notification.sentAt
                        ? ` · Ultimo cambio: ${formatDateTime(notification.sentAt)}`
                        : ''}
                    </div>
                  </div>

                  {notification.status !== 'READ' ? (
                    <MarkNotificationReadButton notificationId={notification.id} />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Pagina {result.page} de {result.totalPages}
          </div>

          <div className="flex gap-2">
            {result.hasPreviousPage ? (
              <Link
                href={buildHref(result.page - 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                Anterior
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-muted-foreground">
                Anterior
              </span>
            )}

            {result.hasNextPage ? (
              <Link
                href={buildHref(result.page + 1)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                Siguiente
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-muted-foreground">
                Siguiente
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
