import { NextResponse } from 'next/server'

import { getCvUrl } from '@/features/profile/public'
import { clientIp } from '@/lib/client-ip'
import { getDb } from '@/lib/db'
import { consumePublicRateLimit } from '@/lib/rate-limit'
import { isBot } from '@/lib/request'

// Tombol Resume CV: catat jumlah unduhan (tanpa data pribadi), lalu arahkan ke berkas terbaru di Cloudinary.
// Satu IP paling banyak tercatat 3 kali per jam agar angka unduhan tidak bisa digelembungkan dengan
// memanggil URL ini berulang (audit 2026-11-01, SEC-03); pengalihan ke berkas tetap selalu jalan.
const COUNT_RULE = { window: 3600, max: 3 }
export async function GET(request: Request) {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'id'
  const cv = await getCvUrl()
  if (!cv) return NextResponse.redirect(new URL(`/${locale}/about`, url), { status: 303 })

  if (!isBot(request.headers.get('user-agent'))) {
    try {
      const limit = await consumePublicRateLimit('cv', clientIp(request.headers), COUNT_RULE)
      if (limit.allowed) await getDb().cvDownload.create({ data: { locale } })
    } catch {
      console.warn('[cv] gagal mencatat unduhan')
    }
  }
  return NextResponse.redirect(cv, { status: 302, headers: { 'Cache-Control': 'no-store' } })
}
