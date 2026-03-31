'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'
import {
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
  { label: 'Finanzas', href: '/finance/receipts', icon: Wallet, roles: ['SUPERADMIN', 'OFFICE_ADMIN'] },
  { label: 'Incidencias', href: '/incidents', icon: AlertTriangle },
  { label: 'Reuniones', href: '/meetings', icon: Calendar },
  { label: 'Documentos', href: '/documents', icon: FileText },
  { label: 'Proveedores', href: '/providers', icon: Truck },
  { label: 'Reportes', href: '/reports', icon: BarChart3, roles: ['SUPERADMIN', 'OFFICE_ADMIN'] },
  { label: 'Configuración', href: '/settings', icon: Settings, roles: ['SUPERADMIN', 'OFFICE_ADMIN'] },
]

interface BackofficeSidebarProps {
  role: UserRole
}

export function BackofficeSidebar({ role }: BackofficeSidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
          COMUNET
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          COMUNET v0.1.0
        </p>
      </div>
    </aside>
  )
}
