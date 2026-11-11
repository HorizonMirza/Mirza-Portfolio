import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getAdminT } from '@/lib/admin-lang-server'

// Navigasi halaman daftar admin (log audit, pesan) lewat tautan ?page=, bekerja tanpa JavaScript.
export async function Pager({
  label,
  page,
  pages,
  href,
}: {
  label: string
  page: number
  pages: number
  href: (page: number) => string
}) {
  if (pages <= 1) return null
  const { t } = await getAdminT()
  return (
    <nav aria-label={label} className="mt-4 flex items-center justify-end gap-2 text-sm">
      <span className="text-muted">{t('Halaman {page} dari {pages}', { page, pages })}</span>
      {page > 1 ? (
        <Button variant="secondary" size="sm" asChild>
          <Link href={href(page - 1)}>{t('Sebelumnya')}</Link>
        </Button>
      ) : null}
      {page < pages ? (
        <Button variant="secondary" size="sm" asChild>
          <Link href={href(page + 1)}>{t('Berikutnya')}</Link>
        </Button>
      ) : null}
    </nav>
  )
}

// Nomor halaman dari query string: bilangan bulat 1–10.000, selain itu halaman 1.
export function parsePage(value: unknown) {
  return Math.max(1, Math.min(10_000, Number.parseInt(String(value ?? '1'), 10) || 1))
}
