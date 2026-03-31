'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import type { ComponentType } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  LayoutDashboard,
  Receipt,
  Wrench,
} from 'lucide-react'

import { cn } from '@/lib/utils'

export interface PortalNavItemDefinition {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  roles: UserRole[]
}

const NAV_ITEMS: PortalNavItemDefinition[] = [
  { label: 'Resumen', href: '/portal', icon: LayoutDashboard, roles: ['OWNER', 'PRESIDENT', 'PROVIDER'] },
  { label: 'Incidencias', href: '/portal/incidents', icon: AlertTriangle, roles: ['OWNER', 'PRESIDENT', 'PROVIDER'] },
  { label: 'Recibos', href: '/portal/receipts', icon: Receipt, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Mi Comunidad', href: '/portal/community', icon: Building2, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Documentos', href: '/portal/documents', icon: FileText, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Reuniones', href: '/portal/meetings', icon: Calendar, roles: ['OWNER', 'PRESIDENT'] },
]

const ROLE_SUBTITLE: Record<UserRole, string> = {
  SUPERADMIN: 'Administración',
  OFFICE_ADMIN: 'Administración',
  OWNER: 'Portal propietario',
  PRESIDENT: 'Portal presidencia',
  PROVIDER: 'Portal proveedor',
}

export function getPortalNavigationItems(role: UserRole) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

interface PortalSidebarProps {
  role: UserRole
}

export function PortalSidebar({ role }: PortalSidebarProps) {
  const pathname = usePathname()
  const visibleItems = getPortalNavigationItems(role)

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          {role === 'PROVIDER' ? (
            <Wrench className="h-4 w-4" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
        </div>
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
          COMUNET
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          {ROLE_SUBTITLE[role]}
        </p>
      </div>
    </aside>
  )
}
