import type { ReactNode } from 'react'

import { getAdminT } from '@/lib/admin-lang-server'

// Judul dan deskripsi diterjemahkan ke bahasa tampilan admin (teks yang belum ada di kamus tetap
// tampil apa adanya, mis. nama project). Judul besar di panel isi dihapus (revisi pemilik 2026-11-11,
// DESIGN.md bagian 118): nama halaman sudah tampil di top bar, jadi h1 hanya untuk pembaca layar.
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
  const visible = Boolean(description || actions)
  return (
    <header
      className={visible ? 'mb-6 flex flex-wrap items-end justify-between gap-4' : 'contents'}
    >
      <h1 className="sr-only">{t(title)}</h1>
      {description ? <p className="max-w-prose min-w-0 text-muted">{t(description)}</p> : null}
      {actions ? <div className="ml-auto flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
