import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { applyTextOverrides } from '@/features/site-text/merge'
import { getTextOverrides } from '@/features/site-text/public'

import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const defaults = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    // teks bawaan, lalu ditimpa suntingan admin (Admin → Teks situs)
    messages: applyTextOverrides(defaults, await getTextOverrides(), locale),
  }
})
