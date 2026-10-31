import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import './globals.css'
import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { NotFound } from '@/components/ui/ghost-404-page'

import { fontVariables } from './fonts'

export const metadata: Metadata = {
  title: '404 — Halaman tidak ditemukan',
}

// 404 untuk URL yang tidak cocok dengan rute mana pun (di luar /id dan /en). Memakai bahasa default
// situs, Indonesia (revisi pemilik 2026-10-18: tidak lagi dua bahasa sekaligus).
// Halaman ini tidak melewati layout, jadi tema mengikuti preferensi sistem (lihat globals.css). Teks
// diambil lewat next-intl dengan locale eksplisit, sehingga suntingan admin (Halaman lain → Halaman
// 404) ikut berlaku seperti di 404 dalam situs (audit 2026-10-31, GAP-07).
export default async function GlobalNotFound() {
  const t = await getTranslations({ locale: 'id', namespace: 'NotFound' })
  return (
    <html lang="id" className={fontVariables}>
      <body className="bg-bg text-text">
        <main>
          <NotFound
            title={t('title')}
            body={t('body')}
            action={
              // eslint-disable-next-line @next/next/no-html-link-for-pages -- halaman ini di luar provider next-intl
              <a href="/id" className={flowButtonClassName}>
                <FlowButtonContent text={t('home')} />
              </a>
            }
          />
        </main>
      </body>
    </html>
  )
}
