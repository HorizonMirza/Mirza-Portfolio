// Halaman 404 "hantu" (diadaptasi dari komponen 21st.dev ghost-404-page): judul, satu kalimat, satu
// tombol. Desainnya dipakai bersama untuk 11 kode status (components/ui/status-page.tsx).

import type { ReactNode } from 'react'

import { StatusPage } from '@/components/ui/status-page'

export function NotFound({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action: ReactNode
}) {
  return <StatusPage code={404} title={title} body={body} action={action} />
}
