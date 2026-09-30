import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/env'

// Panel admin dan API tidak diindeks. Deploy preview Vercel tidak diindeks sama sekali.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/id/newsletter/', '/en/newsletter/'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
