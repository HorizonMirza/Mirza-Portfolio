import type { Metadata } from 'next'
import Link from 'next/link'

import { VisitsChart } from '@/components/admin/visits-chart'
import { Card } from '@/components/ui/card'
import {
  DASHBOARD_RANGES,
  type DayStat,
  getDailyStats,
  getRecentMessages,
  toDashboardRange,
} from '@/features/dashboard/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime, formatDayKey, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Dashboard') }
}

type Lang = Awaited<ReturnType<typeof getAdminT>>['lang']
type Metric = 'visitors' | 'views' | 'cv' | 'messages'

// Jumlah satu ukuran di satu periode (hari tanpa data per pengunjung dilewati)
const total = (days: DayStat[], key: Metric) => days.reduce((sum, d) => sum + (d[key] ?? 0), 0)

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

function StatTile({
  label,
  value,
  href,
  lang,
  spark,
  note,
}: {
  label: string
  value: number
  href: string
  lang: Lang
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
        {formatNumber(value, lang)}
      </span>
      {note ? <span className="text-xs text-muted">{note}</span> : null}
      <Sparkline values={spark} />
    </Link>
  )
}

const STATUS_LABEL = { NEW: 'Baru', READ: 'Dibaca', ARCHIVED: 'Arsip' } as const

// Desain 01 "Ringkas" (pilihan pemilik 2026-11-16, DESIGN.md bagian 165 dan 166): selebar panel isi
// sampai tepi kiri-kanan, empat angka dengan grafik kecil, kunjungan harian dengan periode 7/30/90
// hari (lewat ?range=, tanpa JavaScript tambahan), lalu Rincian per hari dan Pesan terbaru berdampingan.
export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  await requireSuperAdminPage()
  const range = toDashboardRange((await searchParams).range)
  const [current, messages] = await Promise.all([getDailyStats(range), getRecentMessages(5)])
  const { lang, t } = await getAdminT()
  const days = t('{days} hari', { days: range })
  const partialVisitors = current.some((d) => d.visitors === null)

  const tiles: { key: Metric; label: string; href: string }[] = [
    { key: 'visitors', label: t('Pengunjung'), href: '#kunjungan' },
    { key: 'views', label: t('Tayangan Halaman'), href: '#kunjungan' },
    { key: 'cv', label: t('Unduhan CV'), href: '/admin/pages/footer' },
    { key: 'messages', label: t('Pesan Masuk'), href: '/admin/messages' },
  ]

  return (
    <div className="admin-bleed flex flex-col gap-3">
      {/* judul terlihat ada di top bar ("Dashboard"); sapaan besar dihapus (revisi pemilik 2026-11-06) */}
      <h1 className="sr-only">Dashboard</h1>

      <section aria-label={t('Ringkasan')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <StatTile
            key={tile.key}
            label={tile.label}
            value={total(current, tile.key)}
            href={tile.href}
            lang={lang}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3 font-semibold">{t('Kunjungan harian')}</h2>
          {/* kotak periode bersudut kecil dengan garis antar-pilihan, yang aktif terisi penuh seperti
              tab lain di panel admin (revisi pemilik 2026-11-16) */}
          <nav
            aria-label={t('Periode')}
            className="inline-flex divide-x divide-border-strong overflow-hidden rounded-md border border-border-strong"
          >
            {DASHBOARD_RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin?range=${r}`}
                scroll={false}
                replace
                aria-current={r === range ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-9 items-center px-3.5 text-xs font-semibold transition-colors',
                  r === range ? 'bg-text text-bg' : 'text-muted hover:bg-surface-2 hover:text-text',
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
      </Card>

      {/* pesan terbaru (kiri) dan rincian per hari (kanan): satu baris dua kolom (revisi pemilik 2026-11-16) */}
      <div className="grid items-stretch gap-3 lg:grid-cols-2">
        <Card className="min-w-0">
          <h2 className="text-h3 font-semibold">{t('Pesan Terbaru')}</h2>
          {messages.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {t('Belum ada pesan. Pesan dari form di halaman Kontak akan tampil di sini.')}
            </p>
          ) : (
            /* kolom seperti tabel tanpa garis tabel: nama/subjek, status, waktu sejajar di semua baris
               (subgrid; revisi pemilik 2026-11-16) */
            <ul className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className="col-span-full grid grid-cols-subgrid border-b border-border last:border-b-0"
                >
                  <Link
                    href={`/admin/messages/${m.id}`}
                    className="col-span-full grid grid-cols-subgrid items-center py-2.5 hover:opacity-80"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold [overflow-wrap:anywhere]">{m.name}</span>
                      <span className="block text-sm [overflow-wrap:anywhere] text-muted">
                        {m.subject || t('(tanpa subjek)')}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'justify-self-start rounded-full border px-2 text-xs font-semibold',
                        m.status === 'NEW'
                          ? 'border-text bg-text text-bg'
                          : 'border-border-strong text-muted',
                      )}
                    >
                      {t(STATUS_LABEL[m.status])}
                    </span>
                    <span className="hidden justify-self-end font-mono text-xs text-muted tabular-nums sm:inline">
                      {formatDateTime(m.createdAt, lang)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="flex min-w-0 flex-col">
          <h2 className="text-h3 font-semibold">{t('Rincian Perhari')}</h2>
          {/* kotak sendiri yang bisa digulir; kepala tabel menempel dengan latar pekat agar baris yang
            lewat di bawahnya tidak tembus (latar kaca admin tembus pandang) */}
          <div
            role="region"
            aria-label={`${t('Rincian Perhari')}, ${days}`}
            tabIndex={0}
            className="mt-3 max-h-80 min-h-0 flex-1 overflow-y-auto rounded-md border border-border lg:max-h-none lg:min-h-64 lg:flex-[1_1_0px]"
          >
            <table className="w-full border-separate border-spacing-0 text-left text-sm">
              <caption className="sr-only">
                {t('Kunjungan harian')}, {days}
              </caption>
              <thead>
                <tr>
                  {[
                    [t('Tanggal'), ''],
                    [t('Tayangan'), 'text-right'],
                    [t('Pengunjung'), 'text-right'],
                  ].map(([label, align]) => (
                    <th
                      key={label}
                      scope="col"
                      className={cn(
                        'sticky top-0 z-10 border-b border-border bg-bg px-2 py-2 font-medium text-muted sm:px-3',
                        align,
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...current].reverse().map((v) => (
                  <tr key={v.day}>
                    <td className="border-b border-border px-2 py-2 sm:px-3">
                      {formatDayKey(v.day, lang)}
                    </td>
                    <td className="border-b border-border px-2 py-2 text-right tabular-nums sm:px-3">
                      {formatNumber(v.views, lang)}
                    </td>
                    <td className="border-b border-border px-2 py-2 text-right tabular-nums sm:px-3">
                      {v.visitors === null ? '—' : formatNumber(v.visitors, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
