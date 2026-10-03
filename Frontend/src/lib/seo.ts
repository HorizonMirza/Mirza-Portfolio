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

// wa.me butuh kode negara tanpa + atau 0 di depan. Nomor yang diisi dengan awalan 0 (format lokal
// Indonesia, mis. 0812...) diubah ke 62812... agar langsung membuka chat ke nomor itu.
export function whatsappUrl(number: string) {
  const digits = number.replace(/[^0-9]/g, '')
  return `https://wa.me/${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}`
}
