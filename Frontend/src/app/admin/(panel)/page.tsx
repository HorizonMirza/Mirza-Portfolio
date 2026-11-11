import type { Metadata } from 'next'
import Link from 'next/link'

import { VisitsChart } from '@/components/admin/visits-chart'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getDailyVisits, getDashboardStats, getRecentMessages } from '@/features/dashboard/queries'
import { adminDrafts, adminVisitsTotal } from '@/lib/admin-i18n'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime, formatDayKey } from '@/lib/format'

export const metadata: Metadata = { title: 'Dashboard' }

// Tiap angka sekaligus pintasan ke halaman yang mengelolanya
function StatTile({
  label,
  value,
  hint,
  href,
  locale,
}: {
  label: string
  value: number
  hint?: string
  href: string
  locale: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-muted dark:shadow-none"
    >
      <span className="block text-sm text-muted">{label}</span>
      <span className="mt-1 block text-h2 font-bold tabular-nums">
        {value.toLocaleString(locale)}
      </span>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </Link>
  )
}

export default async function DashboardPage() {
  await requireSuperAdminPage()
  const [stats, visits, messages] = await Promise.all([
    getDashboardStats(),
    getDailyVisits(30),
    getRecentMessages(5),
  ])
  const totalVisits = visits.reduce((sum, v) => sum + v.views, 0)
  const { lang, t } = await getAdminT()
  const locale = lang === 'en' ? 'en-US' : 'id-ID'

  return (
    <div className="flex flex-col gap-8">
      {/* judul terlihat ada di top bar ("Dashboard"); sapaan besar dihapus (revisi pemilik 2026-11-06) */}
      <h1 className="sr-only">Dashboard</h1>

      <section aria-label={t('Ringkasan')} className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label={t('Pesan baru')}
          locale={locale}
          value={stats.newMessages}
          href="/admin/messages"
        />
        <StatTile
          label={t('Kunjungan 7 hari')}
          locale={locale}
          value={stats.views7}
          href="#kunjungan"
        />
        <StatTile
          label={t('Unduhan CV 30 hari')}
          locale={locale}
          value={stats.cvDownloads}
          href="/admin/profile"
        />
        <StatTile
          label={t('Project terbit')}
          locale={locale}
          value={stats.published}
          hint={adminDrafts(lang, stats.drafts)}
          href="/admin/projects"
        />
        <StatTile
          label={t('Pengalaman')}
          locale={locale}
          value={stats.experiences}
          href="/admin/experience"
        />
        <StatTile label={t('Skill')} locale={locale} value={stats.skills} href="/admin/skills" />
      </section>

      <Card id="kunjungan" className="scroll-mt-20">
        <h2 className="text-h3 font-semibold">{t('Kunjungan per hari, 30 hari terakhir')}</h2>
        <p className="mt-1 text-sm text-muted">
          {totalVisits === 0
            ? t('Belum ada kunjungan tercatat dalam 30 hari terakhir.')
            : adminVisitsTotal(lang, totalVisits)}
        </p>
        <div className="mt-4">
          <VisitsChart data={visits} />
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-primary underline-offset-4 hover:underline">
            {t('Lihat sebagai tabel')}
          </summary>
          <table className="mt-3 w-full text-left">
            <caption className="sr-only">{t('Kunjungan per hari, 30 hari terakhir')}</caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1 font-medium">
                  {t('Tanggal')}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {t('Kunjungan')}
                </th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.day} className="border-t border-border">
                  <td className="py-1">{formatDayKey(v.day)}</td>
                  <td className="py-1 text-right tabular-nums">{v.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-h3 font-semibold">{t('Pesan terbaru')}</h2>
          <Link
            href="/admin/messages"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('Semua pesan')}
          </Link>
        </div>
        {messages.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            {t('Belum ada pesan. Pesan dari form di halaman Kontak akan tampil di sini.')}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {messages.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.subject || t('(tanpa subjek)')}</p>
                  <p className="text-sm text-muted">
                    {m.name} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                {m.status === 'NEW' ? <Badge tone="primary">{t('Baru')}</Badge> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
