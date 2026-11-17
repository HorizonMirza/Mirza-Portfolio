'use client'

import { useAdminT } from '@/components/admin/admin-lang'
import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { StatusPage } from '@/components/ui/status-page'

// Galat di halaman panel admin: sidebar dan header tetap tampil, hanya isi halaman yang diganti
// halaman status 500 (desain bersama, revisi pemilik 2026-11-16). Sebelumnya jatuh ke halaman bawaan
// Next (audit 2026-10-31, GAP-06). Teks mengikuti bahasa admin. Detail teknis tidak ditampilkan; kode
// digest bisa dicocokkan dengan log server.
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useAdminT()
  const digest =
    error instanceof Error && 'digest' in error && typeof error.digest === 'string'
      ? error.digest
      : null
  const body = t('Coba muat ulang. Bila tetap gagal, periksa koneksi database atau log server.')
  return (
    <StatusPage
      code={500}
      fullHeight={false}
      title={t('Halaman admin gagal dimuat')}
      body={digest ? `${body} ${t('Kode:')} ${digest}` : body}
      action={
        <button type="button" onClick={() => retry()} className={flowButtonClassName}>
          <FlowButtonContent text={t('Coba Lagi')} />
        </button>
      }
    />
  )
}
