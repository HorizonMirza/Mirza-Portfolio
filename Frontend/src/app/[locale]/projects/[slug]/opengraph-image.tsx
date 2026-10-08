import { hasLocale } from 'next-intl'

import { getPublishedProject } from '@/features/projects/public'
import { routing } from '@/i18n/routing'
import { loc } from '@/lib/localized'
import { horizonCard, OG_SIZE } from '@/lib/og/card'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Project · Muhammad Mirza'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const project = await getPublishedProject(slug)
  const summary = project ? loc(project, 'summary', locale) : ''
  return horizonCard({
    eyebrow: `Project${project ? ` · ${project.year}` : ''} · Muhammad Mirza`,
    title: project ? loc(project, 'title', locale) : 'Project',
    subtitle: summary.length > 140 ? `${summary.slice(0, 137)}…` : summary || undefined,
  })
}
