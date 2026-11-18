import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { applyTextOverrides } from '@backend/features/site-text/merge'
import { getTextOverrides } from '@backend/features/site-text/public'

import { routing } from '@backend/i18n/routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const defaults = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    // teks bawaan, lalu ditimpa suntingan admin (diubah langsung di pratinjau admin)
    messages: applyTextOverrides(defaults, await getTextOverrides(), locale),
  }
})
