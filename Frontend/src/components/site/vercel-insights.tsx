'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Query string dibuang sebelum dikirim ke Vercel: tautan konfirmasi dan berhenti newsletter
// membawa token di URL dan tidak boleh ikut tercatat.
function withoutQuery<T extends { url: string }>(event: T): T {
  const url = new URL(event.url)
  url.search = ''
  url.hash = ''
  return { ...event, url: url.toString() }
}

export function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={withoutQuery} />
      <SpeedInsights beforeSend={withoutQuery} />
    </>
  )
}
