import type messages from '../../messages/id.json'
import type { routing } from './routing'

// Kunci terjemahan dan bahasa diketik ketat (salah ketik kunci = error TypeScript).
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
