// Content-Security-Policy dan header keamanan (ARCHITECTURE.md bagian 8).
// - Halaman publik tetap statis (SSG/ISR), jadi tanpa nonce: script-src memakai 'unsafe-inline'
//   karena Next.js menyisipkan skrip inline (payload RSC, skrip tema). Arahan lain tetap ketat.
// - Panel admin memang dinamis, jadi memakai nonce per permintaan + 'strict-dynamic' (src/proxy.ts).
// Dipakai next.config.ts dan proxy, jadi berkas ini tidak boleh bergantung pada modul server.

// upgrade: tambahkan upgrade-insecure-requests (hanya di Vercel/HTTPS; di http://localhost tes lintas
// browser bisa gagal karena permintaan dinaikkan ke https)
export type CspOptions = { nonce?: string; dev: boolean; preview: boolean; upgrade?: boolean }

const CLOUDINARY_IMG = 'https://res.cloudinary.com'
const CLOUDINARY_API = 'https://api.cloudinary.com'
// Toolbar/komentar Vercel yang disuntikkan di deploy preview
const VERCEL_LIVE = 'https://vercel.live'

export function buildCsp({ nonce, dev, preview, upgrade = false }: CspOptions): string {
  const script = nonce
    ? [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`]
    : [`'self'`, `'unsafe-inline'`]
  if (dev) script.push(`'unsafe-eval'`)
  const connect = [`'self'`]
  const img = [`'self'`, 'data:', 'blob:', CLOUDINARY_IMG]
  const frame: string[] = []
  // Unggah admin langsung ke Cloudinary
  if (nonce) connect.push(CLOUDINARY_API)
  if (dev) connect.push('ws:')
  if (preview) {
    script.push(VERCEL_LIVE)
    connect.push(VERCEL_LIVE, 'wss://ws-us3.pusher.com')
    img.push(VERCEL_LIVE, 'https://vercel.com')
    frame.push(VERCEL_LIVE)
  }
  const directives: Record<string, string[]> = {
    'default-src': [`'self'`],
    'script-src': script,
    'style-src': [`'self'`, `'unsafe-inline'`],
    'img-src': img,
    'font-src': [`'self'`],
    'connect-src': connect,
    'frame-src': frame.length ? frame : [`'none'`],
    'object-src': [`'none'`],
    'base-uri': [`'self'`],
    'form-action': [`'self'`],
    'frame-ancestors': [`'none'`],
    'manifest-src': [`'self'`],
    'worker-src': [`'self'`, 'blob:'],
  }
  const policy = Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`)
  if (upgrade && !dev) policy.push('upgrade-insecure-requests')
  return policy.join('; ')
}

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]
