'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import {
  areaPath,
  monotonePath,
  niceTicks,
  pickTickIndexes,
  segments,
  type XY,
} from '@/lib/chart-geometry'
import { formatDayKey, formatNumber } from '@backend/lib/format'

type Point = { day: string; views: number; visitors: number | null }

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
// Grafik SVG buatan sendiri (pengganti recharts, audit 2026-11-17 PERF-04: library itu 102 KB gzip
// untuk satu grafik). Ukuran mengikuti lebar kotak; geometri ada di lib/chart-geometry.ts.
const PAD = { top: 12, right: 12, bottom: 30, left: 36 }
const FONT = 12

export function VisitsChart({ data }: { data: Point[] }) {
  const { lang } = useAdminLang()
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  // ukuran kotak (h-72 berubah dengan ukuran huruf dasar panel), bukan angka tetap
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { width, height } = size
  const n = data.length
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = Math.max(0, height - PAD.top - PAD.bottom)
  const bottom = PAD.top + plotH
  const maxValue = data.reduce((m, d) => Math.max(m, d.views, d.visitors ?? 0), 0)
  const ticks = niceTicks(maxValue)
  const top = ticks[ticks.length - 1]
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1))
  const y = (v: number) => PAD.top + plotH * (1 - v / top)
  const viewPoints: XY[] = data.map((d, i) => ({ x: x(i), y: y(d.views) }))
  const visitorRuns = segments(
    data.map((d, i) => (d.visitors === null ? null : { x: x(i), y: y(d.visitors) })),
  )
  const labelIdx = pickTickIndexes(n, plotW, 96)

  function onMove(event: React.PointerEvent<SVGRectElement>) {
    if (n === 0 || plotW === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))))
  }

  const point = hover === null ? undefined : data[hover]
  const flip = hover !== null && x(hover) > width / 2

  return (
    <div ref={box} className="relative h-72 w-full" aria-hidden="true">
      {width > 0 && height > 0 && n > 0 ? (
        <svg width={width} height={height} className="block overflow-visible">
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
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--border)"
                strokeDasharray="3 6"
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                dy="0.35em"
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize={FONT}
              >
                {formatNumber(tick, lang)}
              </text>
            </g>
          ))}
          <line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={bottom}
            y2={bottom}
            stroke="var(--border-strong)"
          />
          {labelIdx.map((i) => (
            <text
              key={data[i].day}
              x={x(i)}
              y={bottom + 10 + FONT}
              textAnchor={i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}
              fill="var(--text-muted)"
              fontSize={FONT}
            >
              {formatDayKey(data[i].day, lang)}
            </text>
          ))}
          {visitorRuns.map((run) => (
            <g key={run.start}>
              <path d={areaPath(run.items, bottom)} fill={`url(#${id}-visitors)`} />
              <path
                d={monotonePath(run.items)}
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            </g>
          ))}
          <path d={areaPath(viewPoints, bottom)} fill={`url(#${id}-views)`} />
          <path
            d={monotonePath(viewPoints)}
            fill="none"
            stroke="var(--text)"
            strokeWidth={2.25}
            strokeLinecap="round"
          />
          {hover !== null ? (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={bottom}
                stroke="var(--text-muted)"
                strokeDasharray="4 4"
              />
              {data[hover].visitors !== null ? (
                <circle
                  cx={x(hover)}
                  cy={y(data[hover].visitors ?? 0)}
                  r={4}
                  fill="var(--surface)"
                  stroke="var(--text-muted)"
                  strokeWidth={2}
                />
              ) : null}
              <circle
                cx={x(hover)}
                cy={y(data[hover].views)}
                r={5}
                fill="var(--surface)"
                stroke="var(--text)"
                strokeWidth={2.5}
              />
            </g>
          ) : null}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            style={{ touchAction: 'pan-y' }}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      ) : null}
      {point && hover !== null ? (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            top: PAD.top,
            left: x(hover),
            transform: flip ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }}
        >
          <TooltipBody point={point} />
        </div>
      ) : null}
    </div>
  )
}
