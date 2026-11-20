'use client'

// Vercel Speed Insights (dipasang layout hanya di Vercel): kecepatan halaman nyata pengunjung.

import { SpeedInsights } from '@vercel/speed-insights/next'

// Query string dibuang sebelum dikirim ke Vercel: parameter di URL (mis. token atau isian)
// tidak boleh ikut tercatat.
function withoutQuery<T extends { url: string }>(event: T): T {
  const url = new URL(event.url)
  url.search = ''
  url.hash = ''
  return { ...event, url: url.toString() }
}

export function VercelInsights() {
  return <SpeedInsights beforeSend={withoutQuery} />
}
