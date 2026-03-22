'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'
import {
  LayoutDashboard,
  Receipt,
  FileText,
  AlertTriangle,
  Calendar,
  Building2,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/portal', icon: LayoutDashboard },
  { label: 'Recibos', href: '/portal/receipts', icon: Receipt, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Documentos', href: '/portal/documents', icon: FileText, roles: ['OWNER', 'PRESIDENT'] },
  { label: 'Incidencias', href: '/portal/incidents', icon: AlertTriangle },
  { label: 'Reuniones', href: '/portal/meetings', icon: Calendar, roles: ['OWNER', 'PRESIDENT'] },
]

interface PortalSidebarProps {
  role: UserRole
}

export function PortalSidebar({ role }: PortalSidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight">COMUNET</span>
          <p className="text-xs text-sidebar-foreground/50">Portal</p>
        </div>
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
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
