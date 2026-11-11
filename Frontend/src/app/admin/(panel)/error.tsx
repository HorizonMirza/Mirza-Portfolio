'use client'

import { useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'

// Galat di halaman panel admin: sidebar dan header tetap tampil, hanya isi halaman yang diganti
// pesan ini. Sebelumnya jatuh ke halaman bawaan Next (audit 2026-10-31, GAP-06). Teks mengikuti
// bahasa admin. Detail teknis tidak ditampilkan; kode digest bisa dicocokkan dengan log server.
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useAdminT()
  const digest =
    error instanceof Error && 'digest' in error && typeof error.digest === 'string'
      ? error.digest
      : null
  return (
    <div className="flex min-h-[50dvh] flex-col justify-center py-12">
      <p className="font-mono text-label tracking-widest text-note uppercase">{t('Galat')}</p>
      <h1 className="mt-3 text-h2 font-bold">{t('Halaman admin gagal dimuat')}</h1>
      <p className="mt-4 max-w-prose text-muted">
        {t('Coba muat ulang. Bila tetap gagal, periksa koneksi database atau log server.')}
        {digest ? (
          <>
            {' '}
            {t('Kode:')} <code className="font-mono">{digest}</code>
          </>
        ) : null}
      </p>
      <div className="mt-8">
        <Button onClick={() => retry()}>{t('Coba lagi')}</Button>
      </div>
    </div>
  )
}
