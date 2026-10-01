import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'

import '@/app/globals.css'
import { fontVariables } from '@/app/fonts'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Root layout kedua (tanpa awalan bahasa). Panel admin hanya dipakai pemilik, jadi berbahasa Indonesia.
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  // nonce CSP dari src/proxy.ts untuk skrip tema next-themes
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="id" className={fontVariables} suppressHydrationWarning>
      <body className="bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Lewati ke konten utama
        </a>
        <ThemeProvider
          nonce={nonce}
          attribute="class"
          defaultTheme="dark"
          enableSystem
          // warna tidak beranimasi saat tema dipasang (mis. ketika halaman dibuka)
          disableTransitionOnChange
        >
          {/* komponen bersama (toggle tema) memakai teks dari messages/id.json */}
          <NextIntlClientProvider locale="id">
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
