import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Lapis pertama perlindungan /admin: tanpa cookie sesi langsung diarahkan ke login.
// Validasi sesi dan peran yang sebenarnya dilakukan di server (lib/auth-guard.ts).
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return NextResponse.next()
    const hasSession = getSessionCookie(request, { cookiePrefix: 'mm' })
    if (!hasSession) {
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Situs publik: arahkan ke /id atau /en sesuai preferensi bahasa browser.
  return intlMiddleware(request)
}

export const config = {
  // Lewati API, aset Next.js, dan berkas statis.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
}
