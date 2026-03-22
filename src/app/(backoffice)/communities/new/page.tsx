import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { CommunityForm } from './community-form'

export const dynamic = 'force-dynamic'

export default async function NewCommunityPage() {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nueva Comunidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Da de alta una nueva comunidad en el sistema
        </p>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <CommunityForm />
      </div>
    </div>
  )
}
