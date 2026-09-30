import { getPublishedProjects } from '@/features/projects/public'

import { apiLocale, ok, options, text } from '../helpers'

export async function GET(request: Request) {
  const locale = apiLocale(request)
  const projects = await getPublishedProjects()
  return ok(
    projects.map((p) => ({
      slug: p.slug,
      title: text(p, 'title', locale),
      summary: text(p, 'summary', locale),
      year: p.year,
      category: p.category,
      featured: p.featured,
      demoUrl: p.demoUrl,
      repoUrl: p.repoUrl,
      cover: p.cover ? { url: p.cover.url, alt: text(p.cover, 'alt', locale) } : null,
      skills: p.skills.map((s) => s.name),
    })),
    { count: projects.length, locale },
  )
}

export const OPTIONS = options
