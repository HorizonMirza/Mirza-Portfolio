import { getPublishedProject } from '@/features/projects/public'
import { slugSchema } from '@/lib/validation'

import { apiError, apiLocale, ok, options, text } from '../../helpers'

export async function GET(request: Request, { params }: RouteContext<'/api/v1/projects/[slug]'>) {
  const { slug } = await params
  if (!slugSchema.safeParse(slug).success)
    return apiError(404, 'NOT_FOUND', 'Project tidak ditemukan')
  const locale = apiLocale(request)
  const p = await getPublishedProject(slug)
  if (!p) return apiError(404, 'NOT_FOUND', 'Project tidak ditemukan')
  return ok(
    {
      slug: p.slug,
      title: text(p, 'title', locale),
      summary: text(p, 'summary', locale),
      description: text(p, 'description', locale),
      caseStudy: text(p, 'caseStudy', locale),
      year: p.year,
      category: p.category,
      demoUrl: p.demoUrl,
      repoUrl: p.repoUrl,
      cover: p.cover ? { url: p.cover.url, alt: text(p.cover, 'alt', locale) } : null,
      images: p.images.map((i) => ({ url: i.url, alt: text(i, 'alt', locale) })),
      skills: p.skills.map((s) => s.name),
      updatedAt: p.updatedAt,
    },
    { locale },
  )
}

export const OPTIONS = options
