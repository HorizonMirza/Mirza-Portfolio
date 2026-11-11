import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/env'
import { getSiteSettings } from '@/features/settings/public'

// Panel admin dan API tidak diindeks. Deploy preview Vercel tidak diindeks sama sekali. Situs juga tidak
// diindeks bila "Izinkan mesin pencari" dimatikan atau mode perawatan menyala (Admin → Pengaturan);
// halaman publik mendapat meta noindex dari layout pada saat yang sama.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl()
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  const settings = await getSiteSettings()
  if (!settings.allowIndexing || settings.maintenanceMode) {
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
