import type { Metadata } from 'next'
import Link from 'next/link'

import { VisitsChart } from '@/components/admin/visits-chart'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getDailyVisits, getDashboardStats, getRecentMessages } from '@/features/dashboard/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime, formatDayKey } from '@/lib/format'

export const metadata: Metadata = { title: 'Dashboard' }

function StatTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-h2 font-bold tabular-nums">{value.toLocaleString('id-ID')}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  )
}

export default async function DashboardPage() {
  const admin = await requireSuperAdminPage()
  const [stats, visits, messages] = await Promise.all([
    getDashboardStats(),
    getDailyVisits(30),
    getRecentMessages(5),
  ])
  const totalVisits = visits.reduce((sum, v) => sum + v.views, 0)

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono text-label tracking-widest text-muted uppercase">Dashboard</p>
        <h1 className="mt-2 text-h1 font-bold">Halo, {admin.name.split(' ')[0]}.</h1>
      </header>

      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Pesan baru" value={stats.newMessages} />
        <StatTile label="Kunjungan 7 hari" value={stats.views7} />
        <StatTile label="Unduhan CV 30 hari" value={stats.cvDownloads} />
        <StatTile label="Pelanggan newsletter" value={stats.subscribers} hint="terkonfirmasi" />
        <StatTile label="Project terbit" value={stats.published} hint={`${stats.drafts} draf`} />
        <StatTile label="Pengalaman" value={stats.experiences} />
        <StatTile label="Skill" value={stats.skills} />
      </section>

      <Card>
        <h2 className="text-h3 font-semibold">Kunjungan per hari, 30 hari terakhir</h2>
        <p className="mt-1 text-sm text-muted">
          {totalVisits === 0
            ? 'Belum ada kunjungan tercatat. Pencatatan aktif setelah halaman publik diluncurkan.'
            : `Total ${totalVisits.toLocaleString('id-ID')} kunjungan. Hari menurut WIB.`}
        </p>
        <div className="mt-4">
          <VisitsChart data={visits} />
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-primary underline-offset-4 hover:underline">
            Lihat sebagai tabel
          </summary>
          <table className="mt-3 w-full text-left">
            <caption className="sr-only">Kunjungan per hari, 30 hari terakhir</caption>
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1 font-medium">
                  Tanggal
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Kunjungan
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
          <h2 className="text-h3 font-semibold">Pesan terbaru</h2>
          <Link
            href="/admin/messages"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Semua pesan
          </Link>
        </div>
        {messages.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Belum ada pesan. Form kontak aktif mulai Milestone 3.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {messages.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.subject || '(tanpa subjek)'}</p>
                  <p className="text-sm text-muted">
                    {m.name} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                {m.status === 'NEW' ? <Badge tone="primary">Baru</Badge> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
