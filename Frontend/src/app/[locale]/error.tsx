'use client'

import { useTranslations } from 'next-intl'

import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { StatusPage } from '@/components/ui/status-page'
import { Link } from '@/i18n/navigation'

// 500 di dalam situs: pesan sopan tanpa detail teknis (DESIGN.md bagian 6), desain halaman status
// bersama (components/ui/status-page.tsx, revisi pemilik 2026-11-16). "Coba Lagi" memakai retry()
// (mengambil ulang data dari server) seperti halaman galat lain, bukan reset() yang hanya
// menggambar ulang dengan data yang sama (audit 2026-11-17, BUG-04).
export default function LocaleError({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const t = useTranslations('Error')
  return (
    <StatusPage
      code={500}
      title={t('title')}
      body={t('body')}
      action={
        <>
          <button type="button" onClick={() => retry()} className={flowButtonClassName}>
            <FlowButtonContent text={t('retry')} />
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-6 font-medium transition-colors hover:border-text"
          >
            {t('home')}
          </Link>
        </>
      }
    />
  )
}
