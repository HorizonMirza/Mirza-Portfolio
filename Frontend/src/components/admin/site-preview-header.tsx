import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { SiteHeader } from '@/components/site/site-header'
import type { AppLocale } from '@/i18n/routing'

// Navbar situs yang asli di dalam pratinjau 1:1 admin (SiteFrame, DESIGN.md bagian 141): teks dalam
// bahasa yang sedang diubah, menu halaman yang ditiru menyala. Hanya tampilan: inert (tidak bisa
// ditekan atau difokus) agar tombol bahasa, tema, dan menu situs tidak bekerja dari admin.
export async function SitePreviewHeader({
  locale,
  currentPath,
}: {
  locale: AppLocale
  currentPath: string
}) {
  const messages = await getMessages({ locale })
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div inert>
        <SiteHeader locale={locale} currentPath={currentPath} />
      </div>
    </NextIntlClientProvider>
  )
}
