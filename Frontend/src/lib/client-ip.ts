import 'server-only'

// IP pengunjung dari header proxy (Vercel mengisi x-forwarded-for dan x-real-ip).
// Hanya dipakai untuk di-hash (rate limit, pengunjung unik harian), tidak pernah disimpan mentah.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}
