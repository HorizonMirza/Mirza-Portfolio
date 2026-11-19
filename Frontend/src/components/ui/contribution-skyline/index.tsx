'use client'

/**
 * Contribution Skyline: setahun aktivitas GitHub sebagai peta panas yang terlipat menjadi skyline
 * isometrik, lalu kembali datar (diadaptasi dari komponen 21st.dev "contribution-skyline").
 *
 * Satu adegan, bukan dua grafik. Tiap hari adalah kotak di grid; tampilan 2D adalah grid dilihat
 * lurus dari atas, tampilan 3D adalah grid yang sama dilihat dari sudut. Saat berganti tampilan,
 * satu kamera berayun di antara keduanya sementara batang tiap minggu naik (atau turun) bergelombang
 * dari minggu terlama ke terbaru.
 *
 * Arahkan kursor atau ketuk satu hari untuk jumlahnya, tombol panah menjelajah grid, dan di 3D
 * seret untuk memutar (klik dua kali untuk kembali). Warna tema berganti dengan transisi halus.
 *
 * Berkas: model.ts (perhitungan murni), canvas.ts (alat bantu kanvas), engine.ts (gambar dan
 * interaksi), parts.tsx (ikon dan kotak statistik). Berkas ini menyusun DOM-nya.
 */

import * as React from 'react'

import { GITHUB_PALETTE, type Palette } from '@backend/lib/github-palette'

import { createSkylineEngine, type SkylineEngine, type SkylineTheme } from './engine'
import {
  buildGrid,
  computeStats,
  type ContributionDay,
  dayMs,
  monthLabels,
  resolvePalette,
} from './model'
import { CubeIcon, GridIcon, Stat } from './parts'

export type { ContributionDay }

type View = '2d' | '3d'

/** Semua teks yang terlihat atau dibacakan, agar komponen bisa dua bahasa. */
export type SkylineLabels = {
  unit: string
  unitPlural: string
  /** "No contributions" / "Tidak ada kontribusi" */
  none: string
  inLastYear: string
  on: string
  busiest: string
  longest: string
  current: string
  day: string
  days: string
  less: string
  more: string
  view: string
  flat: string
  skyline: string
  keys: string
}

const DEFAULT_SKYLINE_LABELS: SkylineLabels = {
  unit: 'contribution',
  unitPlural: 'contributions',
  none: 'No contributions',
  inLastYear: 'in the last year',
  on: 'on',
  busiest: 'Busiest day',
  longest: 'Longest streak',
  current: 'Current streak',
  day: 'day',
  days: 'days',
  less: 'Less',
  more: 'More',
  view: 'Chart view',
  flat: 'Flat heat map',
  skyline: '3D skyline',
  keys: 'Use the arrow keys to read individual days.',
}

interface ContributionSkylineProps {
  /** Satu entri per hari, `YYYY-MM-DD`. Tanggal berulang dijumlahkan. */
  data: ContributionDay[]
  /** Hari terakhir yang tampil. Bawaan: tanggal terbaru di `data`, atau hari ini. */
  endDate?: string
  /** Tampilan awal. 3D naik dari tampilan datar saat pertama kali terlihat di layar. */
  defaultView?: View
  palette?: Palette
  labels?: SkylineLabels
  /** Pengali tinggi batang di 3D. */
  heightScale?: number
  /** Lama morph, ms. */
  duration?: number
  /** 0 menaruh Minggu di baris atas, 1 menaruh Senin. */
  weekStart?: 0 | 1
  /** Seret untuk memutar di 3D. */
  orbit?: boolean
  locale?: string
  className?: string
}

export default function ContributionSkyline({
  data,
  endDate,
  defaultView = '2d',
  palette = GITHUB_PALETTE,
  labels = DEFAULT_SKYLINE_LABELS,
  heightScale = 1,
  duration = 1300,
  weekStart = 0,
  orbit = true,
  locale = 'en-US',
  className = '',
}: ContributionSkylineProps) {
  const model = React.useMemo(() => {
    const dates = data.map((d) => dayMs(d.date)).filter(Number.isFinite)
    const end =
      endDate != null
        ? dayMs(endDate)
        : dates.length
          ? Math.max(...dates)
          : dayMs(new Date().toISOString())
    const grid = buildGrid(data, end, weekStart)
    return {
      ...grid,
      stats: computeStats(grid.cells),
      months: monthLabels(grid.cells, grid.weeks, locale),
    }
  }, [data, endDate, weekStart, locale])

  const [view, setView] = React.useState<View>(defaultView)
  const [theme, setTheme] = React.useState<SkylineTheme>(() => {
    const p = resolvePalette(palette, false)
    return { dark: false, swatches: ['#ebebeb', ...p], accent: p[3] }
  })
  const [active, setActive] = React.useState(-1)
  const [announce, setAnnounce] = React.useState('')

  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const engine = React.useRef<SkylineEngine | null>(null)

  const nf = React.useMemo(() => new Intl.NumberFormat(locale), [locale])
  // tanggal singkat (HP), lengkap (layar lebar), dengan tahun (tooltip), dan dengan hari (dibacakan)
  const df = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    [locale],
  )
  const dfm = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', timeZone: 'UTC' }),
    [locale],
  )
  const dfy = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [locale],
  )
  const dfl = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [locale],
  )
  const noun = (n: number) => (n === 1 ? labels.unit : labels.unitPlural)
  const amount = (n: number) => (n ? nf.format(n) + ' ' + noun(n) : labels.none)
  const describe = (i: number) => {
    const c = model.cells[i]
    if (!c) return ''
    return amount(c.count) + ' ' + labels.on + ' ' + dfl.format(dayMs(c.date))
  }

  // Semua yang dibaca mesin kanvas, diperbarui tiap render agar mesin tidak memakai props lama.
  const settings = {
    model,
    duration,
    heightScale,
    orbit,
    palette,
    target: view === '3d' ? 1 : 0,
    setActive,
    setTheme,
    setAnnounce,
    describe,
  }
  const cfg = React.useRef(settings)
  React.useLayoutEffect(() => {
    cfg.current = settings
  })

  // Mesin dibangun sekali per mount (dan per bahasa); perubahan lain diteruskan lewat efek di bawah.
  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const tip = tipRef.current
    if (!root || !stage || !canvas || !tip) return
    const created = createSkylineEngine({ root, stage, canvas, tip, cfg, locale })
    engine.current = created
    return () => {
      created?.destroy()
      engine.current = null
    }
  }, [locale])

  React.useEffect(() => {
    engine.current?.kick()
  }, [view])

  React.useEffect(() => {
    engine.current?.load()
  }, [model, heightScale])

  React.useEffect(() => {
    engine.current?.retheme()
  }, [palette])

  // Lebar tooltip dibutuhkan agar tetap di dalam kartu; diukur saat teksnya berubah.
  React.useLayoutEffect(() => {
    const tip = tipRef.current
    if (tip && active >= 0) engine.current?.tipWidth(tip.offsetWidth)
  }, [active, model])

  const { stats } = model
  const range = (a: string | null, b: string | null, withYear = false) => {
    if (!a || !b) return '—'
    const f = withYear ? dfy : df
    return f.format(dayMs(a)) + ' - ' + f.format(dayMs(b))
  }
  const longRange = (a: string | null, b: string | null) =>
    a && b ? dfm.format(dayMs(a)) + ' - ' + dfm.format(dayMs(b)) : '—'
  const dayNoun = (n: number) => (n === 1 ? labels.day : labels.days)
  const is3d = view === '3d'
  // total setahun sudah ada di kalimat judul, jadi statistik tinggal tiga
  const statBlocks = [
    {
      label: labels.busiest,
      value: nf.format(stats.busiest.count),
      unit: noun(stats.busiest.count),
      sub: stats.busiest.date ? df.format(dayMs(stats.busiest.date)) : '—',
      subLong: stats.busiest.date ? dfm.format(dayMs(stats.busiest.date)) : '—',
    },
    {
      label: labels.longest,
      value: nf.format(stats.longest.days),
      unit: dayNoun(stats.longest.days),
      sub: range(stats.longest.start, stats.longest.end),
      subLong: longRange(stats.longest.start, stats.longest.end),
    },
    {
      label: labels.current,
      value: nf.format(stats.current.days),
      unit: dayNoun(stats.current.days),
      sub: range(stats.current.start, stats.current.end),
      subLong: longRange(stats.current.start, stats.current.end),
    },
  ]
  const ease = 'cubic-bezier(0.65, 0, 0.35, 1)'

  return (
    <div ref={rootRef} className={'relative w-full bg-bg text-text ' + className}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 min-w-0 text-[clamp(0.75rem,3.4vw,0.9375rem)] leading-snug font-normal whitespace-nowrap sm:text-xl">
          <span className="font-semibold tabular-nums">{nf.format(stats.total)}</span>{' '}
          {noun(stats.total)} {labels.inLastYear}
        </p>
        <div
          role="group"
          aria-label={labels.view}
          className="relative inline-flex shrink-0 rounded-md border border-border p-0.5"
        >
          <span
            aria-hidden="true"
            className="absolute top-0.5 bottom-0.5 left-0.5 w-8 rounded bg-text transition-transform duration-500 motion-reduce:transition-none"
            style={{
              transform: is3d ? 'translateX(100%)' : 'translateX(0)',
              transitionTimingFunction: ease,
            }}
          />
          {(['2d', '3d'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              aria-label={v === '2d' ? labels.flat : labels.skyline}
              title={v === '2d' ? labels.flat : labels.skyline}
              onClick={() => setView(v)}
              className={
                'relative z-10 grid h-7 w-8 cursor-pointer place-items-center rounded border-0 bg-transparent p-0 transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text motion-reduce:transition-none ' +
                (view === v ? 'text-bg' : 'text-muted')
              }
            >
              {v === '2d' ? <GridIcon /> : <CubeIcon />}
            </button>
          ))}
        </div>
      </header>

      {/* Satu kotak bergaris di sekitar grafik, legenda, dan statistik, seperti profil GitHub.
          Garisnya lapisan teratas (bukan border pembungkus) agar latar sel statistik tidak menimpa
          lengkungan di sudut bawah; p-px menggantikan tebal border agar ukuran isi tetap. */}
      <div className="relative rounded-md p-px">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-md border border-border"
        />
        <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
          <div
            ref={stageRef}
            className="contrib-stage relative w-full overflow-hidden rounded-md outline-offset-4 outline-text has-[:focus-visible]:outline-2"
            style={{ height: 150 }}
          >
            <canvas
              ref={canvasRef}
              tabIndex={0}
              role="img"
              aria-label={
                amount(stats.total) +
                ', ' +
                range(stats.first, stats.last, true) +
                '. ' +
                (is3d ? labels.skyline : labels.flat) +
                '. ' +
                labels.keys
              }
              className="absolute top-0 left-0 block outline-none"
              style={{ maxWidth: 'none', touchAction: is3d && orbit ? 'pan-y' : 'auto' }}
            />
          </div>

          <div
            ref={tipRef}
            role="tooltip"
            aria-hidden={active < 0}
            className="pointer-events-none absolute top-3 left-3 z-20 rounded-md bg-text px-2.5 py-1.5 text-xs leading-none whitespace-nowrap text-bg shadow-lg transition-opacity duration-150 motion-reduce:transition-none sm:top-4 sm:left-4"
            style={{ opacity: active >= 0 ? 1 : 0 }}
          >
            {active >= 0 && model.cells[active] ? (
              <>
                <strong className="font-semibold">{amount(model.cells[active].count)}</strong>
                <span className="opacity-75">
                  {' '}
                  {labels.on} {dfy.format(dayMs(model.cells[active].date))}
                </span>
              </>
            ) : (
              ' '
            )}
            <span
              aria-hidden="true"
              className="absolute top-full h-0 w-0"
              style={{
                left: 'var(--arrow, 50%)',
                marginLeft: -5,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid var(--text)',
              }}
            />
          </div>
        </div>

        {/* Legenda rapat seperti di GitHub, hanya tampilan: kotak serapat ini tidak memenuhi area
            sentuh 24 px WCAG 2.5.8, jadi tidak bisa ditekan */}
        <div className="flex items-center justify-end gap-1 px-3 pt-2 pb-3 text-sm text-muted sm:px-4">
          <span className="mr-1">{labels.less}</span>
          {theme.swatches.map((c, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="block size-[11px] rounded-[2px] transition-[background-color] duration-500 motion-reduce:transition-none"
              style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(127,127,127,0.12)' }}
            />
          ))}
          <span className="ml-1">{labels.more}</span>
        </div>

        {/* Statistik sebagai pita bawah bersekat, tiga kolom di semua ukuran layar. Garis sekat
            berasal dari celah 1 px di atas latar --border. */}
        <div className="grid grid-cols-[repeat(3,auto)] gap-px overflow-hidden rounded-b-[5px] border-t border-border bg-border md:grid-cols-3">
          {statBlocks.map((b) => (
            <Stat key={b.label} {...b} accent={theme.accent} />
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  )
}
