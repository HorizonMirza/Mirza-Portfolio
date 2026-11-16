'use client'

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { formatDayKey, formatNumber } from '@/lib/format'

type Point = { day: string; views: number; visitors: number | null }

type TooltipProps = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return <TooltipBody point={payload[0]?.payload as Point | undefined} />
}

function TooltipBody({ point }: { point?: Point }) {
  const { lang } = useAdminLang()
  const t = useAdminT()
  if (!point) return null
  return (
    <div className="rounded-md bg-text px-3 py-2 text-sm text-bg shadow-lg">
      <p className="font-semibold">{formatDayKey(point.day, lang)}</p>
      <p>
        {t('Tayangan')}: <b className="tabular-nums">{formatNumber(point.views, lang)}</b>
      </p>
      <p>
        {t('Pengunjung')}:{' '}
        <b className="tabular-nums">
          {point.visitors === null ? '—' : formatNumber(point.visitors, lang)}
        </b>
      </p>
    </div>
  )
}

// Desain 01 "Ringkas" (pilihan pemilik 2026-11-16): tayangan sebagai garis tebal dengan arsiran,
// pengunjung unik sebagai garis putus, warna mengikuti teks tema (hitam-putih seperti panel admin).
// Grafik hanya visual (aria-hidden); datanya ada di tabel "Lihat sebagai tabel" di bawahnya.
export function VisitsChart({ data }: { data: Point[] }) {
  const { lang } = useAdminLang()
  return (
    <div className="h-64 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
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
          <Area
            type="monotone"
            dataKey="views"
            stroke="var(--text)"
            strokeWidth={2}
            fill="var(--text)"
            fillOpacity={0.08}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--text)', stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="visitors"
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{
              r: 3,
              fill: 'var(--text-muted)',
              stroke: 'var(--surface)',
              strokeWidth: 2,
            }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
