// Judul dan deskripsi diterjemahkan ke bahasa tampilan admin (teks yang belum ada di kamus tetap
// tampil apa adanya, mis. nama project). Nama halaman tampil di
// top bar, jadi h1 di sini hanya untuk pembaca layar.

import type { ReactNode } from 'react'

import { getAdminT } from '@backend/lib/admin-lang-server'

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
