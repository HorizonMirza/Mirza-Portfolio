import type { MetadataRoute } from 'next'

import { getPublishedProjects } from '@/features/projects/public'
import { routing } from '@/i18n/routing'
import { siteUrl } from '@/lib/env'

const STATIC_PATHS = ['', '/about', '/experience', '/projects', '/contact', '/privacy']

// Setiap halaman tercantum per bahasa dengan alternatif hreflang ke bahasa lain.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const projects = await getPublishedProjects()
  const paths = [...STATIC_PATHS, ...projects.map((p) => `/projects/${p.slug}`)]
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency:
        path === '' || path === '/projects' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : path.startsWith('/projects/') ? 0.7 : 0.6,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`])),
      },
    })),
  )
}
