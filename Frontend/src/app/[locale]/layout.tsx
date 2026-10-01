import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ViewTransition } from 'react'

import '@/app/globals.css'
import { fontVariables } from '@/app/fonts'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { PageViewTracker } from '@/components/site/page-view-tracker'
import { RevealObserver } from '@/components/site/reveal-observer'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { VercelInsights } from '@/components/site/vercel-insights'
import { WhatsAppButton } from '@/components/site/whatsapp-button'
import { routing } from '@/i18n/routing'
import { siteUrl } from '@/lib/env'

// Hanya id dan en yang sah: locale lain ditolak lewat hasLocale() → notFound().
// Jangan set `dynamicParams = false` di sini. Dengan itu, render ulang ISR setelah admin menyimpan
// gagal (NoFallbackError) dan seluruh halaman publik menjadi 404 (ditemukan lewat tes E2E, M3).

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t('title'), template: '%s — Muhammad Mirza' },
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  // wajib untuk render statis dengan next-intl
  setRequestLocale(locale)
  const t = await getTranslations('Common')

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        >
          {t('skipToContent')}
        </a>
        <ThemeProvider
          attribute="class"
          // tampilan awal gelap (keputusan pemilik M4); pilihan pengunjung tersimpan
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            {/* pb: ruang untuk menu bawah di HP (fixed) agar footer tidak tertutup */}
            <div className="flex min-h-dvh flex-col pb-24 lg:pb-0">
              <SiteHeader locale={locale} />
              <main id="main" className="flex-1">
                {/* Transisi antarhalaman: fade singkat lewat View Transitions (tanpa library) */}
                <ViewTransition>{children}</ViewTransition>
              </main>
              <SiteFooter locale={locale} />
            </div>
            <WhatsAppButton locale={locale} />
            <RevealObserver />
            <PageViewTracker />
            {/* Hanya di Vercel: di luar Vercel skrip /_vercel/* tidak ada (404 di CI dan lokal) */}
            {process.env.VERCEL === '1' && <VercelInsights />}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
