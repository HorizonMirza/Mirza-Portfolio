import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

// Mengarahkan pengunjung ke /id atau /en sesuai preferensi bahasa browser.
export default createMiddleware(routing)

export const config = {
  // Lewati API, panel admin (tanpa awalan bahasa), aset Next.js, dan berkas statis.
  matcher: '/((?!api|admin|_next|_vercel|.*\\..*).*)',
}
