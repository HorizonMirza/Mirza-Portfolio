import type { Metadata } from 'next'

import './globals.css'
import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { NotFound } from '@/components/ui/ghost-404-page'

import { fontVariables } from './fonts'

export const metadata: Metadata = {
  title: '404 — Halaman tidak ditemukan / Page not found',
}

// 404 untuk URL yang tidak cocok dengan rute mana pun (di luar /[locale]). Dua bahasa sekaligus.
// Halaman ini tidak melewati layout, jadi tema mengikuti preferensi sistem (lihat globals.css) dan
// teks ditulis langsung (tanpa provider next-intl).
export default function GlobalNotFound() {
  return (
    <html lang="id" className={fontVariables}>
      <body className="bg-bg text-text">
        <main>
          <NotFound
            title="Boo! Halamannya hilang."
            subtitle={<p lang="en">Boo! Page missing.</p>}
            body="Sepertinya halaman ini hantu: dicari ada, dibuka tidak ada."
            whatIs="Apa itu 404? · What does 404 mean?"
            whatIsBody="404 berarti alamat yang Anda buka tidak ada di situs ini. 404 means the address you opened does not exist on this site."
            action={
              // eslint-disable-next-line @next/next/no-html-link-for-pages -- halaman ini di luar provider next-intl
              <a href="/id" className={flowButtonClassName}>
                <FlowButtonContent text="Beranda · Home" />
              </a>
            }
          />
        </main>
      </body>
    </html>
  )
}
