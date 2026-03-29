'use client'

import { DonutChart, HBarChart } from '@/components/ui/charts'
import { formatCurrency } from '@/lib/formatters'

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
      <DonutChart
        data={donutData}
        centerValue={centerValue}
        centerLabel={centerLabel}
        height={220}
      />
    )
  }

  if (type === 'hbar' && hbarData) {
    return (
      <HBarChart
        data={hbarData}
        height={Math.max(120, hbarData.length * 50)}
        formatValue={formatValue}
      />
    )
  }

  return null
}
