import { NextResponse } from 'next/server'

import { getCvUrl } from '@/features/profile/public'
import { getDb } from '@/lib/db'
import { isBot } from '@/lib/request'

// Unduh CV: catat jumlah unduhan (tanpa data pribadi), lalu arahkan ke berkas terbaru di Cloudinary.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'id'
  const cv = await getCvUrl()
  if (!cv) return NextResponse.redirect(new URL(`/${locale}/about`, url), { status: 303 })

  if (!isBot(request.headers.get('user-agent'))) {
    try {
      await getDb().cvDownload.create({ data: { locale } })
    } catch {
      console.warn('[cv] gagal mencatat unduhan')
    }
  }
  return NextResponse.redirect(cv, { status: 302, headers: { 'Cache-Control': 'no-store' } })
}
