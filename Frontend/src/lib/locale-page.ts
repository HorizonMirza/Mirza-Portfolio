import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { type AppLocale, routing } from '@/i18n/routing'

// Validasi locale + setRequestLocale (wajib agar halaman tetap statis dengan next-intl).
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<AppLocale> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return locale
}

export async function metadataLocale(
  params: Promise<{ locale: string }>,
): Promise<AppLocale | null> {
  const { locale } = await params
  return hasLocale(routing.locales, locale) ? locale : null
}
