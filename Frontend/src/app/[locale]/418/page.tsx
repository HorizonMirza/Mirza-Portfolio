// Halaman status 418 ("I'm a teapot") di situs publik, memakai desain halaman status bersama.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { StatusPage } from '@/components/ui/status-page'
import { Link } from '@/i18n/navigation'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'

// Easter egg 418 "I'm a teapot" (RFC 2324) di /id/418 dan /en/418.
// Kode status HTTP 418 dipasang oleh proxy (src/proxy.ts); halaman tidak diindeks.
export async function generateMetadata({ params }: PageProps<'/[locale]/418'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Status' })
  return { title: `418 · ${t('418.title')}`, robots: { index: false, follow: false } }
}

export default async function TeapotPage({ params }: PageProps<'/[locale]/418'>) {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'Status' })
  return (
    <StatusPage
      code={418}
      title={t('418.title')}
      body={t('418.body')}
      action={
        <Link href="/" className={flowButtonClassName}>
          <FlowButtonContent text={t('home')} />
        </Link>
      }
    />
  )
}
