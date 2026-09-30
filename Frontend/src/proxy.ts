import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import { buildCsp } from './lib/csp'

const intlMiddleware = createMiddleware(routing)

// Panel admin dirender dinamis, jadi mendapat CSP ber-nonce per permintaan. Next.js membaca
// nonce dari header CSP permintaan dan memasangnya ke skripnya sendiri.
function adminResponse(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp({
    nonce,
    dev: process.env.NODE_ENV !== 'production',
    preview: process.env.VERCEL_ENV === 'preview',
    upgrade: process.env.VERCEL === '1',
  })
  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)
  headers.set('Content-Security-Policy', csp)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

// Lapis pertama perlindungan /admin: tanpa cookie sesi langsung diarahkan ke login.
// Validasi sesi dan peran yang sebenarnya dilakukan di server (lib/auth-guard.ts).
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname !== '/admin/login' && !getSessionCookie(request, { cookiePrefix: 'mm' })) {
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return adminResponse(request)
  }

  // Situs publik: arahkan ke /id atau /en sesuai preferensi bahasa browser.
  return intlMiddleware(request)
}

export const config = {
  // Lewati API, aset Next.js, dan berkas statis.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
}
