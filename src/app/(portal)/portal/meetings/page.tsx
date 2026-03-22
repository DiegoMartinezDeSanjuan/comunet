export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/auth'

export default async function Page() {
  await requireAuth()
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
      Reuniones - Próximamente
    </div>
  )
}
