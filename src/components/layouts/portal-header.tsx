'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, ShieldCheck, User } from 'lucide-react'

import type { Session } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/modules/auth/server/actions'

import { getPortalNavigationItems } from './portal-sidebar'

interface PortalHeaderProps {
  session: Session
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  PRESIDENT: 'Presidencia',
  PROVIDER: 'Proveedor',
}

export function PortalHeader({ session }: PortalHeaderProps) {
  const pathname = usePathname()
  const navItems = getPortalNavigationItems(session.role)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Breadcrumb area */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Portal ({ROLE_LABELS[session.role] ?? session.role})
          </h2>
        </div>

        {/* Right: User info & actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Notificaciones"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground leading-tight">{session.name}</p>
              <p className="text-xs text-muted-foreground">{session.email}</p>
            </div>
          </div>

          {/* Logout */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="border-t border-border px-4 py-3 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
