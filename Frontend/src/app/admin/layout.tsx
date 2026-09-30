import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'

import '@/app/globals.css'
import { jakarta, jetbrains } from '@/app/fonts'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Root layout kedua (tanpa awalan bahasa). Panel admin hanya dipakai pemilik, jadi berbahasa Indonesia.
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Lewati ke konten utama
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
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
