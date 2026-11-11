'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAdminLang } from '@/components/admin/admin-lang'
import { formatDayKey, formatNumber } from '@/lib/format'

type Point = { day: string; views: number }

type TooltipProps = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return <TooltipBody point={payload[0]?.payload as Point | undefined} />
}

function TooltipBody({ point }: { point?: Point }) {
  const { lang } = useAdminLang()
  if (!point) return null
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="text-muted">{formatDayKey(point.day, lang)}</p>
      <p className="font-semibold text-text">
        {formatNumber(point.views, lang)} {lang === 'en' ? 'visits' : 'kunjungan'}
      </p>
    </div>
  )
}

// Satu seri (tanpa legenda, judul kartu yang menamainya). Garis 2 px, crosshair + tooltip,
// warna --chart-1 yang sudah divalidasi untuk mode terang dan gelap.
export function VisitsChart({ data }: { data: Point[] }) {
  const { lang } = useAdminLang()
  return (
    <div className="h-64 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        {/* grafik hanya visual (aria-hidden); datanya tersedia di tabel di bawahnya, jadi tidak perlu fokus keyboard */}
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tickFormatter={(day: string) => formatDayKey(day, lang)}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <Tooltip
            content={(props) => <ChartTooltip active={props.active} payload={props.payload} />}
            cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
