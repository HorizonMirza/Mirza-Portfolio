// Tipe pesan next-intl dari messages/id.json agar kunci terjemahan diperiksa TypeScript.

import type { routing } from '@backend/i18n/routing'

import type messages from '../../messages/id.json'

// Kunci terjemahan dan bahasa diketik ketat (salah ketik kunci = error TypeScript).
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
