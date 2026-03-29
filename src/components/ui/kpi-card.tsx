import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

export type KPITrend = 'up' | 'down' | 'neutral'

interface KPICardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: KPITrend
  trendLabel?: string
  /** Semantic color: 'default' | 'danger' | 'warning' | 'success' */
  accent?: 'default' | 'danger' | 'warning' | 'success'
  className?: string
}

const ACCENT_COLORS = {
  default: 'text-foreground',
  danger:  'text-red-400',
  warning: 'text-amber-400',
  success: 'text-green-400',
}

const ACCENT_BG = {
  default: 'bg-primary/10 text-primary',
  danger:  'bg-red-500/10 text-red-400',
  warning: 'bg-amber-500/10 text-amber-400',
  success: 'bg-green-500/10 text-green-400',
}

const TREND_COLORS = {
  up:      'text-green-400',
  down:    'text-red-400',
  neutral: 'text-muted-foreground',
}

const TREND_ICONS = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
}

export function KPICard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  accent = 'default',
  className,
}: KPICardProps) {
  const TrendIcon = trend ? TREND_ICONS[trend] : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:border-border hover:shadow-md',
        className,
      )}
    >
      {/* Gradient glow on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn('text-2xl font-bold tracking-tight tabular-nums', ACCENT_COLORS[accent])}>
            {value}
          </p>
          {trend && trendLabel ? (
            <div className={cn('flex items-center gap-1 text-xs font-medium', TREND_COLORS[trend])}>
              {TrendIcon ? <TrendIcon className="h-3 w-3" /> : null}
              {trendLabel}
            </div>
          ) : null}
        </div>

        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', ACCENT_BG[accent])}>
          {icon}
        </div>
      </div>
    </div>
  )
}
