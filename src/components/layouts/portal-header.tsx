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
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div>
          <p className="text-sm font-medium text-foreground">{ROLE_LABELS[session.role] ?? 'Portal'}</p>
          <p className="text-xs text-muted-foreground">
            Acceso con alcance validado en servidor para tus comunidades y unidades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium leading-tight text-foreground">{session.name}</p>
              <p className="text-xs text-muted-foreground">{session.email}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground lg:flex">
            <ShieldCheck className="h-4 w-4" />
            <span>{ROLE_LABELS[session.role] ?? session.role}</span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <nav className="border-t border-border px-4 py-3 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
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
