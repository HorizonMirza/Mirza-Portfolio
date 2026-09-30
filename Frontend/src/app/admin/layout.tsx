import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import '@/app/globals.css'
import { jakarta, jetbrains } from '@/app/fonts'
import { ThemeProvider } from '@/components/shared/theme-provider'

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
