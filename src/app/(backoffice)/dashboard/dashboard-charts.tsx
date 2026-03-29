'use client'

import { DonutChart } from '@/components/ui/charts'

interface DashboardChartsProps {
  donutData: { name: string; value: number; color: string }[]
  paidPct: number
}

export function DashboardCharts({ donutData, paidPct }: DashboardChartsProps) {
  return (
    <DonutChart
      data={donutData}
      centerValue={`${paidPct}%`}
      centerLabel="cobrado"
      height={200}
    />
  )
}
