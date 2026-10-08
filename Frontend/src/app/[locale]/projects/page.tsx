import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, PageIntro } from '@/components/site/section-heading'
import { getPublicProfile } from '@/features/profile/public'
import { ProjectRow } from '@/features/projects/components/public/project-row'
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
  const github = profile?.socials.github

  return (
    <Container className="pb-20">
      {/* judul di tengah, tanpa kalimat pengantar dan tanpa filter (revisi pemilik 2026-10-08) */}
      <PageIntro title={t('title')} align="center" />
      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-muted">{t('empty')}</p>
      ) : (
        // Pilihan pemilik 2026-10-08 (demo 6): gambar dan teks zig-zag, tanpa kartu bertumpuk.
        <ol className="flex flex-col gap-16 md:gap-24">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <ProjectRow project={p} index={i} locale={locale} />
            </li>
          ))}
        </ol>
      )}

      {projects.length > 0 && projects.length < 3 ? (
        <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
          {t('more')}
          {github ? (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
            >
              {t('moreGithub')}
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only">{tCommon('openInNewTab')}</span>
            </a>
          ) : null}
          <Link href="/experience" className="text-primary underline underline-offset-4">
            {t('moreJourney')}
          </Link>
        </p>
      ) : null}
    </Container>
  )
}
