'use client'

// Galat di halaman panel admin: sidebar dan header tetap tampil, hanya isi halaman yang diganti
// halaman status 500 (desain bersama). Teks mengikuti bahasa admin. Detail teknis tidak ditampilkan; kode
// digest bisa dicocokkan dengan log server.

import { useAdminT } from '@/components/admin/admin-lang'
import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { StatusPage } from '@/components/ui/status-page'

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
