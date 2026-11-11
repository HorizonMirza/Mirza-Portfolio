import 'server-only'

import { getDb } from '@/lib/db'

const MAX_UA = 300

// Kota dan negara dari header geolokasi Vercel (mis. "Jakarta, ID"), hanya di Vercel: di luar Vercel
// header ini bisa dipalsukan klien. Tanpa layanan tambahan dan tanpa menyimpan IP.
export function locationFromHeaders(
  headers: Headers | null | undefined,
  onVercel: boolean = process.env.VERCEL === '1',
): string | null {
  if (!headers || !onVercel) return null
  const decode = (v: string | null) => {
    if (!v) return null
    try {
      return decodeURIComponent(v).trim().slice(0, 80) || null
    } catch {
      return null
    }
  }
  const city = decode(headers.get('x-vercel-ip-city'))
  const country = decode(headers.get('x-vercel-ip-country'))
  const place = [city, country].filter(Boolean).join(', ')
  return place || null
}

// Catat satu percobaan masuk panel admin (Admin → Akun, DESIGN.md bagian 120). Email yang diketik tidak
// disimpan: hanya dipakai untuk mencari akun pemiliknya. Gagal mencatat tidak boleh menggagalkan login.
export async function recordLoginEvent(input: {
  kind: 'success' | 'failed'
  userId?: string | null
  email?: string | null
  sessionId?: string | null
  headers?: Headers | null
}) {
  try {
    const db = getDb()
    let userId = input.userId ?? null
    if (!userId && input.email) {
      const user = await db.user.findUnique({
        where: { email: input.email.trim().toLowerCase() },
        select: { id: true },
      })
      userId = user?.id ?? null
    }
    await db.loginEvent.create({
      data: {
        kind: input.kind,
        userId,
        sessionId: input.sessionId ?? null,
        userAgent: input.headers?.get('user-agent')?.slice(0, MAX_UA) ?? null,
        location: locationFromHeaders(input.headers),
      },
    })
  } catch {
    console.warn('[auth] riwayat masuk tidak tercatat')
  }
}
