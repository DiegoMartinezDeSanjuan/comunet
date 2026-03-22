export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/auth'

export default async function PortalDashboardPage() {
  const session = await requireAuth()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenido a tu portal, {session.name}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        El resumen de tu comunidad aparecerá aquí próximamente.
      </div>
    </div>
  )
}
