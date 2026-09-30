'use client'

import { useLocale } from 'next-intl'
import { useEffect } from 'react'

import { usePathname } from '@/i18n/navigation'

// Catat kunjungan halaman tanpa cookie (sendBeacon tidak menunda navigasi).
// Hash pengunjung dibuat di server dengan kunci harian (lihat /api/track).
export function PageViewTracker() {
  const pathname = usePathname()
  const locale = useLocale()

  useEffect(() => {
    if (navigator.webdriver) return
    const body = JSON.stringify({ path: pathname, locale, referrer: document.referrer || null })
    const blob = new Blob([body], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/api/track', blob)) {
      void fetch('/api/track', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
        keepalive: true,
      })
    }
  }, [pathname, locale])

  return null
}
