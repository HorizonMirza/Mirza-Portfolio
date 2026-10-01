import type { Metadata } from 'next'

import './globals.css'
import { fontVariables } from './fonts'

export const metadata: Metadata = {
  title: '404 — Halaman tidak ditemukan / Page not found',
}

// 404 untuk URL yang tidak cocok dengan rute mana pun (di luar /[locale]). Dua bahasa sekaligus.
// Halaman ini tidak melewati layout, jadi tema mengikuti preferensi sistem (lihat globals.css).
export default function GlobalNotFound() {
  return (
    <html lang="id" className={fontVariables}>
      <body className="bg-bg text-text">
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4">
          <p className="font-mono text-label tracking-widest text-note uppercase">404</p>
          <h1 className="mt-3 text-h1 font-bold">Halaman tidak ditemukan</h1>
          <p className="mt-2 text-muted" lang="en">
            Page not found
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- halaman ini di luar provider next-intl */}
          <a
            href="/id"
            className="mt-8 font-semibold text-primary underline-offset-4 hover:underline"
          >
            Beranda · <span lang="en">Home</span>
          </a>
        </main>
      </body>
    </html>
  )
}
