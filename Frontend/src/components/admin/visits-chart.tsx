'use client'

import { useId } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
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
  const weekday = new Date(`${point.day}T00:00:00Z`).toLocaleDateString(
    lang === 'en' ? 'en-US' : 'id-ID',
    { weekday: 'long', timeZone: 'UTC' },
  )
  return (
    <div className="min-w-40 rounded-md border border-border-strong bg-bg px-3 py-2.5 text-sm shadow-lg">
      <p className="text-xs text-muted">
        {weekday}, {formatDayKey(point.day, lang)}
      </p>
      <p className="mt-1.5 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-text" />
          {t('Tayangan')}
        </span>
        <b className="tabular-nums">{formatNumber(point.views, lang)}</b>
      </p>
      <p className="mt-0.5 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-muted" />
          {t('Pengunjung')}
        </span>
        <b className="tabular-nums">
          {point.visitors === null ? '—' : formatNumber(point.visitors, lang)}
        </b>
      </p>
    </div>
  )
}

// Desain 01 "Ringkas" (pilihan pemilik 2026-11-16, dipercantik di revisi malam): tayangan sebagai garis
// tebal dengan arsiran bergradasi, pengunjung unik sebagai garis putus dengan arsiran tipis, garis bantu
// putus-putus, titik bercincin saat disorot, dan tooltip berisi hari, tanggal, serta dua angka.
// Warna mengikuti teks tema (hitam-putih seperti panel admin). Grafik hanya visual (aria-hidden);
// datanya ada di tabel Rincian per hari.
export function VisitsChart({ data }: { data: Point[] }) {
  const { lang } = useAdminLang()
  const id = useId().replace(/:/g, '')
  return (
    <div className="h-72 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 0, left: -12 }}
          accessibilityLayer={false}
        >
          <defs>
            <linearGradient id={`${id}-views`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--text)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${id}-visitors`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-muted)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--text-muted)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
          <XAxis
            dataKey="day"
            tickFormatter={(day: string) => formatDayKey(day, lang)}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-strong)' }}
            tickMargin={10}
            minTickGap={32}
            interval="preserveStartEnd"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickCount={5}
            width={48}
            tickMargin={6}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <Tooltip
            content={(props) => <ChartTooltip active={props.active} payload={props.payload} />}
            cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="visitors"
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            fill={`url(#${id}-visitors)`}
            dot={false}
            activeDot={{
              r: 4,
              fill: 'var(--surface)',
              stroke: 'var(--text-muted)',
              strokeWidth: 2,
            }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="var(--text)"
            strokeWidth={2.25}
            strokeLinecap="round"
            fill={`url(#${id}-views)`}
            dot={false}
            activeDot={{ r: 5, fill: 'var(--surface)', stroke: 'var(--text)', strokeWidth: 2.5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
