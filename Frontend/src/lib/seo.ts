import type { Metadata } from 'next'

import { type AppLocale, routing } from '@/i18n/routing'

// Metadata per halaman: judul, deskripsi, canonical, dan hreflang ke versi bahasa lain.
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
}: {
  locale: AppLocale
  path: string
  title: string
  description?: string
  absoluteTitle?: boolean
}): Metadata {
  const suffix = path === '/' ? '' : path
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: `/${locale}${suffix}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${suffix}`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}${suffix}`,
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
  }
}

export function whatsappUrl(number: string) {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}`
}
