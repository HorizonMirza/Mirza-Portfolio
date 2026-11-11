import type { ReactNode } from 'react'

import { getAdminT } from '@/lib/admin-lang-server'

// Judul dan deskripsi diterjemahkan ke bahasa tampilan admin (teks yang belum ada di kamus tetap
// tampil apa adanya, mis. nama project). Huruf Inter biasa, bukan Oswald kapital (DESIGN.md bagian 113).
export async function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  const { t } = await getAdminT()
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {/* lebih kecil di HP agar judul panjang (mis. nama project) tidak memakan layar */}
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight break-words sm:text-[2.125rem]">
          {t(title)}
        </h1>
        {description ? <p className="mt-2 max-w-prose text-muted">{t(description)}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
