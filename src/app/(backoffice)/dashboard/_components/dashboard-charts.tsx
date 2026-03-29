'use client'

import dynamic from 'next/dynamic'

const DonutChartLazy = dynamic(
  () => import('@/components/ui/charts').then(mod => ({ default: mod.DonutChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <div className="h-32 w-32 rounded-full bg-muted animate-pulse" />
      </div>
    ),
    ssr: false,
  },
)

interface DashboardChartsProps {
  donutData: { name: string; value: number; color: string }[]
  paidPct: number
}

export function DashboardCharts({ donutData, paidPct }: DashboardChartsProps) {
  return (
    <DonutChartLazy
      data={donutData}
      centerValue={`${paidPct}%`}
      centerLabel="cobrado"
      height={200}
    />
  )
}
