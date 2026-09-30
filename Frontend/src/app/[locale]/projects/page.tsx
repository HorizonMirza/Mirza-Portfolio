import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, PageIntro } from '@/components/site/section-heading'
import { getPublicProfile } from '@/features/profile/public'
import { ProjectCard } from '@/features/projects/components/public/project-card'
import { ProjectFilter } from '@/features/projects/components/public/project-filter'
import { getPublishedProjects } from '@/features/projects/public'
import { Link } from '@/i18n/navigation'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/projects'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Projects' })
  return pageMetadata({
    locale,
    path: '/projects',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function ProjectsPage({ params }: PageProps<'/[locale]/projects'>) {
  const locale = await resolveLocale(params)
  const [t, tCommon, projects, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Projects' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublishedProjects(),
    getPublicProfile(),
  ])
  const categories = [...new Set(projects.map((p) => p.category))]
  // Filter baru berguna bila ada cukup project (DESIGN.md bagian 5.5).
  const showFilter = projects.length >= 3 || categories.length >= 2
  const skills = [
    ...new Map(projects.flatMap((p) => p.skills).map((s) => [s.id, s])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name))
  const github = profile?.socials.github

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} intro={t('intro')} />
      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-muted">{t('empty')}</p>
      ) : projects.length === 1 ? (
        <ProjectCard
          project={projects[0]!}
          index={0}
          locale={locale}
          variant="wide"
          headingLevel="h2"
        />
      ) : showFilter ? (
        <ProjectFilter
          categories={categories.map((c) => ({ value: c, label: t(c) }))}
          skills={skills}
          items={projects.map((p) => ({
            slug: p.slug,
            category: p.category,
            skillIds: p.skills.map((s) => s.id),
          }))}
        >
          {projects.map((p, i) => (
            <div key={p.slug} data-card={p.slug}>
              <ProjectCard project={p} index={i} locale={locale} headingLevel="h2" />
            </div>
          ))}
        </ProjectFilter>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} locale={locale} headingLevel="h2" />
          ))}
        </div>
      )}

      {projects.length > 0 && projects.length < 3 ? (
        <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
          {t('more')}
          {github ? (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {t('moreGithub')}
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only">{tCommon('openInNewTab')}</span>
            </a>
          ) : null}
          <Link href="/experience" className="text-primary hover:underline">
            {t('moreJourney')}
          </Link>
        </p>
      ) : null}
    </Container>
  )
}
