import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/env'
import { getSiteSettings } from '@/features/settings/public'

// Panel admin dan API tidak diindeks. Deploy preview Vercel tidak diindeks sama sekali. Situs juga tidak
// diindeks selama mode perawatan menyala (Admin → Pengaturan); halaman publik mendapat meta noindex dari
// layout pada saat yang sama. Selain itu situs selalu boleh diindeks (saklar dihapus 2026-11-16).
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl()
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  const settings = await getSiteSettings()
  if (settings.maintenanceMode) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
