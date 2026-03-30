'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/modules/auth/server/actions'
import type { Session } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'
import {
  LogOut,
  Bell,
  User,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Wallet,
  AlertTriangle,
  Calendar,
  FileText,
  Truck,
  BarChart3,
  Settings,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Comunidades', href: '/communities', icon: Building2 },
  { label: 'Propietarios', href: '/owners', icon: Users },
  { label: 'Inquilinos', href: '/tenants', icon: UserCheck },
  { label: 'Finanzas', href: '/finance/receipts', icon: Wallet, roles: ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { label: 'Incidencias', href: '/incidents', icon: AlertTriangle },
  { label: 'Reuniones', href: '/meetings', icon: Calendar },
  { label: 'Documentos', href: '/documents', icon: FileText },
  { label: 'Proveedores', href: '/providers', icon: Truck },
  { label: 'Reportes', href: '/reports', icon: BarChart3, roles: ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { label: 'Configuración', href: '/settings', icon: Settings, roles: ['SUPERADMIN', 'OFFICE_ADMIN'] },
]

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
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(session.role as UserRole)
  )

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Menu button (mobile) + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h2 className="text-sm font-medium text-muted-foreground">
            Backoffice
          </h2>
        </div>

        {/* Right: User info & actions */}
        <div className="flex items-center gap-2 sm:gap-4">
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
      </div>

      {/* Mobile Navigation — slide-down menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
