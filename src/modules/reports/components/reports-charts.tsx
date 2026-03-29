'use client'

import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/formatters'

const DonutChartLazy = dynamic(
  () => import('@/components/ui/charts').then(mod => ({ default: mod.DonutChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center" style={{ height: 220 }}>
        <div className="h-36 w-36 rounded-full bg-muted animate-pulse" />
      </div>
    ),
    ssr: false,
  },
)

const HBarChartLazy = dynamic(
  () => import('@/components/ui/charts').then(mod => ({ default: mod.HBarChart })),
  {
    loading: () => (
      <div className="space-y-3 animate-pulse p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-5 rounded bg-muted" style={{ width: `${80 - i * 20}%` }} />
        ))}
      </div>
    ),
    ssr: false,
  },
)

interface ReportsChartsProps {
  type: 'donut' | 'hbar'
  donutData?: { name: string; value: number; color: string }[]
  centerValue?: string | number
  centerLabel?: string
  hbarData?: { name: string; value: number; color?: string }[]
  /** Use 'currency' to format as EUR */
  formatType?: 'currency'
}

export function ReportsCharts({
  type,
  donutData,
  centerValue,
  centerLabel,
  hbarData,
  formatType,
}: ReportsChartsProps) {
  const formatValue = formatType === 'currency'
    ? (value: number) => formatCurrency(value)
    : undefined

  if (type === 'donut' && donutData) {
    return (
      <DonutChartLazy
        data={donutData}
        centerValue={centerValue}
        centerLabel={centerLabel}
        height={220}
      />
    )
  }

  if (type === 'hbar' && hbarData) {
    return (
      <HBarChartLazy
        data={hbarData}
        height={Math.max(120, hbarData.length * 50)}
        formatValue={formatValue}
      />
    )
  }

  return null
}
