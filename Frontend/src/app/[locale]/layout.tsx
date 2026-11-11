import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ViewTransition } from 'react'

import '@/app/globals.css'
import { fontVariables } from '@/app/fonts'
import { LanguageScramble } from '@/components/shared/language-scramble'
import { ThemeClassSync } from '@/components/shared/theme-class-sync'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { PageTransitions } from '@/components/site/page-transitions'
import { PageViewTracker } from '@/components/site/page-view-tracker'
import { RevealObserver } from '@/components/site/reveal-observer'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { MaintenanceNotice } from '@/components/site/maintenance-notice'
import { NavigationSkeleton } from '@/components/site/navigation-skeleton'
import { VercelInsights } from '@/components/site/vercel-insights'
import { WhatsAppFloat } from '@/components/site/whatsapp-float'
import { routing } from '@/i18n/routing'
import { siteUrl } from '@/lib/env'
import { DEFAULT_THEME_ATTR, THEME_STORAGE_KEY } from '@/lib/theme'
import { getPublicProfile } from '@/features/profile/public'
import { IntroNoticeSlot } from '@/features/settings/components/public/intro-notice-slot'
import { introPendingScript } from '@/features/settings/intro-pending'
import { getSiteSettings } from '@/features/settings/public'

// Hanya id dan en yang sah: locale lain ditolak lewat hasLocale() → notFound().
// Jangan set `dynamicParams = false` di sini. Dengan itu, render ulang ISR setelah admin menyimpan
// gagal (NoFallbackError) dan seluruh halaman publik menjadi 404 (ditemukan lewat tes E2E, M3).

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'Metadata' }),
    getSiteSettings(),
  ])

  return {
    // Admin → Pengaturan: "Izinkan mesin pencari" mati atau mode perawatan menyala → noindex di semua
    // halaman publik (halaman yang memasang robots sendiri tetap memakai miliknya)
    ...(!settings.allowIndexing || settings.maintenanceMode
      ? { robots: { index: false, follow: false } }
      : {}),
    metadataBase: new URL(siteUrl()),
    title: { default: t('title'), template: '%s · Muhammad Mirza' },
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
  const [t, settings, profile] = await Promise.all([
    getTranslations('Common'),
    getSiteSettings(),
    getPublicProfile(),
  ])
  const maintenance = settings.maintenanceMode
  const intro = maintenance ? null : settings.intro

  return (
    <html
      lang={locale}
      className={fontVariables}
      // volume suara tombol dari /admin/settings, dibaca lib/ui-sounds.ts
      data-sound-volume={settings.soundVolume}
      // tema awal untuk pengunjung yang belum memilih (Admin → Pengaturan), dibaca lib/theme.ts
      {...{ [DEFAULT_THEME_ATTR]: settings.defaultTheme }}
      suppressHydrationWarning
    >
      <body className="bg-bg text-text">
        {/* Sebelum apa pun tampil: tandai bila pemberitahuan pembuka akan dibuka, agar beranda tidak
            berkedip sebelum kartu muncul. Isi skrip konstanta tetap (bukan masukan), aman tanpa sanitasi. */}
        {intro ? (
          <script dangerouslySetInnerHTML={{ __html: introPendingScript(intro.frequency) }} />
        ) : null}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        >
          {t('skipToContent')}
        </a>
        <ThemeProvider
          attribute="class"
          // tampilan awal dari Admin → Pengaturan (bawaan gelap, keputusan pemilik M4); pilihan
          // pengunjung tersimpan dan didahulukan
          defaultTheme={settings.defaultTheme}
          enableSystem={settings.defaultTheme === 'system'}
          storageKey={THEME_STORAGE_KEY}
          // warna tidak beranimasi saat tema dipasang (mis. ketika halaman dibuka)
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            {/* pb: ruang untuk menu bawah di HP (fixed) agar footer tidak tertutup.
                overflow-x-clip: tidak ada isi yang boleh lebih lebar dari layar. Di HP, halaman baru
                masuk bergeser 40 px (page-transitions.tsx); tanpa clip lebar halaman sesaat jadi 430 px,
                Chrome HP memperkecil tampilan agar muat dan tetap begitu, lalu menu bawah (fixed bottom)
                terdorong ke luar layar. Penyebab "menu bawah HP hilang saat pindah bagian" (2026-10-20).
                clip, bukan hidden: tidak membuat wadah gulir, jadi header sticky tetap bekerja. */}
            {maintenance ? (
              <MaintenanceNotice name={profile?.name ?? 'Muhammad Mirza'} />
            ) : (
              <div className="flex min-h-dvh flex-col overflow-x-clip pb-28 lg:pb-0">
                <SiteHeader locale={locale} />
                {/* isolate: z-index di dalam isi halaman (logo globe, menu kategori) tidak bisa naik ke atas
                      navbar atas dan menu bawah HP (laporan pemilik 2026-10-20: navbar HP hilang saat pindah
                      bagian) */}
                <main id="main" className="relative isolate flex-1">
                  {/* Transisi antarhalaman lewat View Transitions (tanpa library): dari menu utama
                        halaman bergeser searah urutan menu, daftar project ↔ detail memudar pelan mengikuti
                        gambar yang terbang, navigasi lain memakai pudar singkat. */}
                  <ViewTransition
                    update={{
                      'nav-forward': 'nav-forward',
                      'nav-back': 'nav-back',
                      'project-open': 'project-page',
                      'project-close': 'project-page',
                      default: 'auto',
                    }}
                  >
                    {children}
                  </ViewTransition>
                </main>
                <SiteFooter locale={locale} />
              </div>
            )}
            <ThemeClassSync />
            <PageTransitions />
            <RevealObserver />
            <LanguageScramble />
            {/* statistik kunjungan bisa dimatikan di Admin → Pengaturan (/api/track juga menolak) */}
            {settings.trackVisits && !maintenance ? <PageViewTracker /> : null}
            {settings.whatsappButton && !maintenance ? <WhatsAppFloat /> : null}
            {/* skeleton shimmer saat pindah halaman, hanya di browser (DESIGN.md bagian 125) */}
            {maintenance ? null : <NavigationSkeleton />}
            {/* pemberitahuan pembuka dari Admin → Home, tab Kartu pembuka, frekuensinya dari Admin → Pengaturan */}
            {intro ? <IntroNoticeSlot locale={locale} intro={intro} /> : null}
            {/* Hanya di Vercel: di luar Vercel skrip /_vercel/* tidak ada (404 di CI dan lokal) */}
            {process.env.VERCEL === '1' && <VercelInsights />}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
