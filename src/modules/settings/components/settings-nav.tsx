'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BuildingIcon, UsersIcon, ShieldAlertIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'

const settingsItems = [
  {
    title: 'Despacho',
    href: '/settings',
    icon: BuildingIcon,
    exact: true,
    roles: ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
  },
  {
    title: 'Usuarios',
    href: '/settings/users',
    icon: UsersIcon,
    roles: ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER'],
  },
  {
    title: 'Auditoría',
    href: '/settings/audit',
    icon: ShieldAlertIcon,
    roles: ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER', 'ACCOUNTANT'],
  },
]

export function SettingsNav({ role }: { role: UserRole }) {
  const pathname = usePathname()

  const allowedItems = settingsItems.filter((item) => item.roles.includes(role))

  return (
    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
      {allowedItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
