import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['id', 'en'],
  defaultLocale: 'id',
  // URL selalu memakai awalan bahasa: /id/... dan /en/...
  localePrefix: 'always',
})

export type AppLocale = (typeof routing.locales)[number]
