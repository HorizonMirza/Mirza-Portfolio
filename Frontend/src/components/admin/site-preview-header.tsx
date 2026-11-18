import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { SiteHeader } from '@/components/site/site-header'
import type { AppLocale } from '@backend/i18n/routing'

// Navbar situs yang asli di dalam pratinjau 1:1 admin (SiteFrame, revisi 2026-11-12): teks dalam
// bahasa yang sedang diubah, menu halaman yang ditiru menyala. Hanya tampilan: inert (tidak bisa
// ditekan atau difokus) agar tombol bahasa, tema, dan menu situs tidak bekerja dari admin.
export async function SitePreviewHeader({
  locale,
  currentPath,
  editable = false,
}: {
  locale: AppLocale
  currentPath: string
  // Admin → Navbar: nama menu diketik langsung; hanya foto dan tombol bahasa/tema yang inert
  editable?: boolean
}) {
  const messages = await getMessages({ locale })
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div inert={editable ? undefined : true}>
        <SiteHeader locale={locale} currentPath={currentPath} editable={editable} />
      </div>
    </NextIntlClientProvider>
  )
}
