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
  { label: 'Recibos', href: '/portal/receipts', icon: Receipt, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Incidencias', href: '/portal/incidents', icon: AlertTriangle, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Documentos', href: '/portal/documents', icon: FileText, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Reuniones', href: '/portal/meetings', icon: Calendar, roles: ['OWNER', 'PRESIDENT'] },
]

const ROLE_SUBTITLE: Record<UserRole, string> = {
  SUPERADMIN: 'Administración',
  OFFICE_ADMIN: 'Administración',
  MANAGER: 'Administración',
  ACCOUNTANT: 'Administración',
  VIEWER: 'Administración',
  OWNER: 'Portal propietario',
  PRESIDENT: 'Portal presidencia',
  PROVIDER: 'Proveedor pendiente',
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
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card/60 md:flex md:flex-col">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">COMUNET</p>
            <p className="text-xs text-muted-foreground">{ROLE_SUBTITLE[role]}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-6 py-4">
        <p className="text-xs leading-5 text-muted-foreground">
          {role === 'PROVIDER'
            ? 'El carril de proveedor se completará en un slice posterior.'
            : 'Datos visibles solo dentro del alcance del propietario o de la presidencia activa.'}
        </p>
      </div>
    </aside>
  )
}
