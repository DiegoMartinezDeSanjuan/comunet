'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ── Donut Chart ─────────────────────────────────────────── */

interface DonutItem {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutItem[]
  centerLabel?: string
  centerValue?: string | number
  height?: number
}

export function DonutChart({ data, centerLabel, centerValue, height = 200 }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0)

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222.2 84% 4.9%)',
              border: '1px solid hsl(217.2 32.6% 17.5%)',
              borderRadius: '8px',
              color: 'hsl(210 40% 98%)',
              fontSize: '12px',
            }}
            formatter={((value: number) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, '']) as never}
          />
        </PieChart>
      </ResponsiveContainer>

      {centerValue !== undefined ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{centerValue}</span>
          {centerLabel ? (
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Horizontal Bar Chart ────────────────────────────────── */

interface HBarItem {
  name: string
  value: number
  color?: string
}

interface HBarChartProps {
  data: HBarItem[]
  height?: number
  formatValue?: (value: number) => string
}

export function HBarChart({ data, height = 200, formatValue }: HBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0} minHeight={0}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222.2 84% 4.9%)',
            border: '1px solid hsl(217.2 32.6% 17.5%)',
            borderRadius: '8px',
            color: 'hsl(210 40% 98%)',
            fontSize: '12px',
          }}
          formatter={((value: number) => [formatValue ? formatValue(value) : value, '']) as never}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={`bar-${index}`} fill={entry.color || '#3B82F6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
