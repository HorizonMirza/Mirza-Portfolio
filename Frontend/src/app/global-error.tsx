'use client'

import './globals.css'

import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { StatusPage } from '@/components/ui/status-page'

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
        <main>
          {/* desain halaman status bersama (revisi pemilik 2026-11-16) */}
          <StatusPage
            code={500}
            title="Terjadi kesalahan"
            body="Halaman ini gagal dimuat. Coba lagi sebentar lagi."
            action={
              <>
                <button type="button" onClick={() => retry()} className={flowButtonClassName}>
                  <FlowButtonContent text="Coba Lagi" />
                </button>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- dokumen ini di luar layout dan router */}
                <a
                  href="/id"
                  className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-6 font-medium transition-colors hover:border-text"
                >
                  Kembali ke Beranda
                </a>
              </>
            }
          />
        </main>
      </body>
    </html>
  )
}
