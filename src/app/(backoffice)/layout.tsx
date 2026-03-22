import { redirect } from 'next/navigation'
import { getCurrentSession, isBackofficeRole } from '@/lib/auth'
import { BackofficeSidebar } from '@/components/layouts/backoffice-sidebar'
import { BackofficeHeader } from '@/components/layouts/backoffice-header'

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  if (!isBackofficeRole(session.role)) redirect('/portal')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <BackofficeSidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BackofficeHeader session={session} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
