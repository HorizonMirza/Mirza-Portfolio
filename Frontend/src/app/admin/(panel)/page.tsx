import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { VisitsChart } from '@/components/admin/visits-chart'
import { Card } from '@/components/ui/card'
import {
  DASHBOARD_RANGES,
  type DayStat,
  getContentCounts,
  getDailyStats,
  getRecentMessages,
  toDashboardRange,
} from '@/features/dashboard/queries'
import { adminDrafts } from '@/lib/admin-i18n'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime, formatDayKey, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Dashboard') }
}

type T = Awaited<ReturnType<typeof getAdminT>>['t']
type Lang = Awaited<ReturnType<typeof getAdminT>>['lang']
type Metric = 'visitors' | 'views' | 'cv' | 'messages'

// Jumlah satu ukuran di satu periode; null bila ada hari tanpa data per pengunjung
function total(days: DayStat[], key: Metric): number | null {
  let sum = 0
  for (const d of days) {
    const v = d[key]
    if (v === null) return null
    sum += v
  }
  return sum
}

// Grafik kecil di dalam kotak angka (hanya hiasan; angkanya ada di kotak dan di tabel)
function Sparkline({ values }: { values: (number | null)[] }) {
  const v = values.map((x) => x ?? 0)
  const max = Math.max(1, ...v)
  const pts = v.map(
    (x, i) =>
      `${((i / Math.max(1, v.length - 1)) * 100).toFixed(2)},${(28 - (x / max) * 26).toFixed(2)}`,
  )
  return (
    <svg
      className="mt-2 block h-8 w-full text-text"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={`M0,30 L${pts.join(' L')} L100,30 Z`} fill="currentColor" fillOpacity={0.08} />
      <path
        d={`M${pts.join(' L')}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// Naik/turun dibanding periode sebelumnya yang sama panjang
function Delta({
  now,
  prev,
  days,
  lang,
  t,
}: {
  now: number | null
  prev: number | null
  days: number
  lang: Lang
  t: T
}) {
  if (now === null || prev === null || prev === 0)
    return (
      <span className="font-mono text-xs text-muted">
        —<span className="sr-only"> {t('tanpa pembanding')}</span>
      </span>
    )
  const change = (now - prev) / prev
  const value = Math.abs(change).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  })
  if (Math.abs(change) < 0.0005)
    return (
      <span className="font-mono text-xs text-muted">
        • 0%<span className="sr-only"> {t('sama dengan {days} hari sebelumnya', { days })}</span>
      </span>
    )
  const up = change > 0
  return (
    <span
      className={cn('font-mono text-xs whitespace-nowrap', up ? 'text-success' : 'text-danger')}
    >
      <span aria-hidden="true">{up ? '▲' : '▼'} </span>
      {value}
      <span className="sr-only">
        {' '}
        {up
          ? t('naik dari {days} hari sebelumnya', { days })
          : t('turun dari {days} hari sebelumnya', { days })}
      </span>
    </span>
  )
}

function StatTile({
  label,
  value,
  href,
  lang,
  delta,
  spark,
  note,
}: {
  label: string
  value: number | null
  href: string
  lang: Lang
  delta: ReactNode
  spark: (number | null)[]
  note?: string
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-muted dark:shadow-none"
    >
      <span className="text-sm text-muted">{label}</span>
      <span className="text-h2 leading-tight font-bold tabular-nums">
        {value === null ? '—' : formatNumber(value, lang)}
      </span>
      {delta}
      {note ? <span className="text-xs text-muted">{note}</span> : null}
      <Sparkline values={spark} />
    </Link>
  )
}

const STATUS_LABEL = { NEW: 'Baru', READ: 'Dibaca', ARCHIVED: 'Arsip' } as const

// Desain 01 "Ringkas" (pilihan pemilik 2026-11-16, DESIGN.md): empat angka dengan naik/turun dan
// grafik kecil, grafik kunjungan dengan periode 7/30/90 hari (lewat ?range=, tanpa JavaScript
// tambahan), pesan terbaru, dan jumlah konten di situs.
export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  await requireSuperAdminPage()
  const range = toDashboardRange((await searchParams).range)
  const [stats, content, messages] = await Promise.all([
    getDailyStats(range * 2),
    getContentCounts(),
    getRecentMessages(4),
  ])
  const { lang, t } = await getAdminT()
  const current = stats.slice(range)
  const previous = stats.slice(0, range)
  const days = t('{days} hari', { days: range })
  const partialVisitors = current.some((d) => d.visitors === null)
  // tanpa data per pengunjung di sebagian hari: jumlah dari hari yang masih ada
  const visitorsNow = partialVisitors
    ? current.reduce((s, d) => s + (d.visitors ?? 0), 0)
    : total(current, 'visitors')

  const tiles: { key: Metric; label: string; href: string; now: number | null }[] = [
    { key: 'visitors', label: t('Pengunjung'), href: '#kunjungan', now: visitorsNow },
    {
      key: 'views',
      label: t('Tayangan halaman'),
      href: '#kunjungan',
      now: total(current, 'views'),
    },
    { key: 'cv', label: t('Unduhan CV'), href: '/admin/pages/footer', now: total(current, 'cv') },
    {
      key: 'messages',
      label: t('Pesan masuk'),
      href: '/admin/messages',
      now: total(current, 'messages'),
    },
  ]

  const contentRows = [
    {
      label: t('Project terbit'),
      value: content.published,
      hint: adminDrafts(lang, content.drafts),
      href: '/admin/projects',
    },
    {
      label: t('Pengalaman'),
      value: content.experiences,
      hint: t('Kerja dan organisasi'),
      href: '/admin/experience',
    },
    { label: t('Pendidikan'), value: content.education, hint: '', href: '/admin/profile' },
    {
      label: t('Skill'),
      value: content.skills,
      hint: t('{count} kategori', { count: content.skillCategories }),
      href: '/admin/skills',
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* judul terlihat ada di top bar ("Dashboard"); sapaan besar dihapus (revisi pemilik 2026-11-06) */}
      <h1 className="sr-only">Dashboard</h1>

      <section aria-label={t('Ringkasan')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <StatTile
            key={tile.key}
            label={`${tile.label}, ${days}`}
            value={tile.now}
            href={tile.href}
            lang={lang}
            delta={
              <Delta
                now={tile.key === 'visitors' && partialVisitors ? null : tile.now}
                prev={total(previous, tile.key)}
                days={range}
                lang={lang}
                t={t}
              />
            }
            note={
              tile.key === 'visitors' && partialVisitors
                ? t('Data per pengunjung disimpan sesuai Pengaturan')
                : undefined
            }
            spark={current.map((d) => d[tile.key])}
          />
        ))}
      </section>

      <Card id="kunjungan" className="scroll-mt-20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-h3 font-semibold">{t('Kunjungan harian')}</h2>
            <p className="mt-1 text-sm text-muted">{t('Hari menurut WIB')}</p>
          </div>
          <nav
            aria-label={t('Periode')}
            className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
          >
            {DASHBOARD_RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin?range=${r}`}
                scroll={false}
                replace
                aria-current={r === range ? 'page' : undefined}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-semibold transition-colors',
                  r === range
                    ? 'bg-surface text-text shadow-[0_0_0_1px_var(--border-strong)]'
                    : 'text-muted hover:text-text',
                )}
              >
                {t('{days} hari', { days: r })}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-4">
          <VisitsChart
            data={current.map((d) => ({ day: d.day, views: d.views, visitors: d.visitors }))}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2 rounded-full bg-text" />
            {t('Tayangan')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2 rounded-full bg-muted" />
            {t('Pengunjung (garis putus)')}
          </span>
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium underline-offset-4 hover:underline">
            {t('Lihat sebagai tabel')}
          </summary>
          <table className="mt-3 w-full text-left">
            <caption className="sr-only">
              {t('Kunjungan harian')}, {days}
            </caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1 font-medium">
                  {t('Tanggal')}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {t('Tayangan')}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {t('Pengunjung')}
                </th>
              </tr>
            </thead>
            <tbody>
              {current.map((v) => (
                <tr key={v.day} className="border-t border-border">
                  <td className="py-1">{formatDayKey(v.day, lang)}</td>
                  <td className="py-1 text-right tabular-nums">{formatNumber(v.views, lang)}</td>
                  <td className="py-1 text-right tabular-nums">
                    {v.visitors === null ? '—' : formatNumber(v.visitors, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-h3 font-semibold">{t('Pesan terbaru')}</h2>
            <Link
              href="/admin/messages"
              className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-semibold transition-colors hover:border-text"
            >
              {t('Semua pesan')}
            </Link>
          </div>
          {messages.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {t('Belum ada pesan. Pesan dari form di halaman Kontak akan tampil di sini.')}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {messages.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/admin/messages/${m.id}`}
                    className="flex min-w-0 items-center gap-3 py-2.5 hover:opacity-80"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{m.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {m.subject || t('(tanpa subjek)')}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2 text-xs font-semibold',
                        m.status === 'NEW'
                          ? 'border-text bg-text text-bg'
                          : 'border-border-strong text-muted',
                      )}
                    >
                      {t(STATUS_LABEL[m.status])}
                    </span>
                    <span className="hidden shrink-0 font-mono text-xs text-muted sm:inline">
                      {formatDateTime(m.createdAt, lang)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-h3 font-semibold">{t('Konten di situs')}</h2>
          <ul className="mt-2 divide-y divide-border">
            {contentRows.map((row) => (
              <li key={row.href + row.label}>
                <Link href={row.href} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{row.label}</span>
                    {row.hint ? <span className="block text-sm text-muted">{row.hint}</span> : null}
                  </span>
                  <span className="text-xl font-bold tabular-nums">
                    {formatNumber(row.value, lang)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
