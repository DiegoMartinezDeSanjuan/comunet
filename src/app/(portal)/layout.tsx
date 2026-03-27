export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import type { ReactNode } from 'react'

import { PortalHeader } from '@/components/layouts/portal-header'
import { PortalSidebar } from '@/components/layouts/portal-sidebar'

import { getCurrentSession, isPortalRole } from '@/lib/auth'

export default async function PortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getCurrentSession()

  if (!session) redirect('/login')

  if (!isPortalRole(session.role)) redirect('/dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <PortalSidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader session={session} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
