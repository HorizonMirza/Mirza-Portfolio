'use client'

import './globals.css'

import { fontVariables } from './fonts'

// Galat di root layout (situs maupun admin), sebelumnya jatuh ke halaman bawaan Next berbahasa
// Inggris tanpa gaya (audit 2026-10-31, GAP-06). Halaman ini mengganti seluruh dokumen dan tidak
// punya provider next-intl maupun akses database, jadi teksnya ditulis langsung sama dengan
// messages/id.json → Error, dalam bahasa default situs. Tema gelap sesuai bawaan situs.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="id" className={`${fontVariables} dark`}>
      <body className="bg-bg text-text">
        <title>Terjadi kesalahan</title>
        <main className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <p className="font-mono text-label tracking-widest text-note uppercase">500</p>
          <h1 className="mt-3 text-h1 font-bold">Terjadi kesalahan</h1>
          <p className="mt-4 max-w-prose text-muted">
            Halaman ini gagal dimuat. Coba lagi sebentar lagi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-text px-6 font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-note"
            >
              Coba lagi
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- dokumen ini di luar layout dan router */}
            <a
              href="/id"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-note"
            >
              Kembali ke beranda
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
