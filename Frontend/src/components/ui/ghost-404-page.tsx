import type { ReactNode } from 'react'

import { StatusPage } from '@/components/ui/status-page'

// Halaman 404 "hantu" (komponen 21st.dev ghost-404-page, disesuaikan; revisi pemilik 2026-10-18:
// judul, satu kalimat, satu tombol). Sejak 2026-11-16 desainnya dipakai bersama untuk 11 kode status
// (components/ui/status-page.tsx); 404 tetap dengan ikon hantu.
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
