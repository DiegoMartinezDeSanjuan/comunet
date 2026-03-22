import { redirect } from 'next/navigation'
import { getCurrentSession, isPortalRole } from '@/lib/auth'
import { PortalSidebar } from '@/components/layouts/portal-sidebar'
import { PortalHeader } from '@/components/layouts/portal-header'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  if (!isPortalRole(session.role)) redirect('/dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PortalSidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader session={session} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
