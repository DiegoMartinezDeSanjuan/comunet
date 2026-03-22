'use client'

import { logoutAction } from '@/modules/auth/server/actions'
import type { Session } from '@/lib/auth'
import { LogOut, Bell, User } from 'lucide-react'

interface BackofficeHeaderProps {
  session: Session
}

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  OFFICE_ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  ACCOUNTANT: 'Contable',
  VIEWER: 'Consultor',
}

export function BackofficeHeader({ session }: BackofficeHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Left: Breadcrumb area */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Backoffice
        </h2>
      </div>

      {/* Right: User info & actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Notificaciones"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground leading-tight">{session.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[session.role] || session.role}</p>
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
    </header>
  )
}
