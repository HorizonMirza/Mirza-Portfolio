import { ArrowLeft, ArrowRight, Code2, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { Chip, Container } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import { GithubMetaLine } from '@/features/projects/components/public/github-meta'
import { getPublishedProject, getPublishedProjects } from '@/features/projects/public'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

// Project baru yang terbit setelah build tetap bisa dibuka (dirender saat pertama diminta).
export const dynamicParams = true

export async function generateStaticParams() {
  const projects = await getPublishedProjects()
  return routing.locales.flatMap((locale) => projects.map((p) => ({ locale, slug: p.slug })))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/projects/[slug]'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  const { slug } = await params
  if (!locale) return {}
  const project = await getPublishedProject(slug)
  if (!project) return {}
  // Gambar Open Graph dibuat oleh opengraph-image.tsx di folder ini.
  return pageMetadata({
    locale,
    path: `/projects/${slug}`,
    title: loc(project, 'title', locale),
    description: loc(project, 'summary', locale),
  })
}

export default async function ProjectPage({ params }: PageProps<'/[locale]/projects/[slug]'>) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const [t, tCommon, project, all] = await Promise.all([
    getTranslations({ locale, namespace: 'Projects' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublishedProject(slug),
    getPublishedProjects(),
  ])
  if (!project) notFound()

  const index = all.findIndex((p) => p.slug === slug)
  const prev = index > 0 ? all[index - 1] : null
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null
  const caseStudy = loc(project, 'caseStudy', locale)

  return (
    <Container className="pb-20">
      <nav aria-label="breadcrumb" className="pt-8">
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('back')}
        </Link>
      </nav>

      <header className="pt-6 pb-10">
        <p className="flex flex-wrap gap-x-2 font-mono text-label tracking-widest text-note uppercase">
          <span>{t(project.category)}</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
        </p>
        <h1 className="mt-3 max-w-3xl text-h1 font-bold">{loc(project, 'title', locale)}</h1>
        <p className="mt-4 max-w-prose text-body text-muted">{loc(project, 'summary', locale)}</p>
        {project.demoUrl || project.repoUrl ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {project.demoUrl ? (
              <Button asChild>
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" />
                  {t('demo')}
                  <span className="sr-only">{tCommon('openInNewTab')}</span>
                </a>
              </Button>
            ) : null}
            {project.repoUrl ? (
              <Button asChild variant="secondary">
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <Code2 aria-hidden="true" />
                  {t('repo')}
                  <span className="sr-only">{tCommon('openInNewTab')}</span>
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {project.cover ? (
        <Image
          src={project.cover.url}
          alt={loc(project.cover, 'alt', locale)}
          width={project.cover.width ?? 1600}
          height={project.cover.height ?? 900}
          sizes="(min-width: 1200px) 1136px, 100vw"
          priority
          className="mb-12 h-auto w-full rounded-lg border border-border"
        />
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-12">
          <section aria-labelledby="project-overview">
            <h2 id="project-overview" className="mb-4 text-h2 font-bold">
              {t('overview')}
            </h2>
            <MarkdownView source={loc(project, 'description', locale)} size="base" />
          </section>
          {caseStudy ? (
            <section aria-labelledby="project-case">
              <h2 id="project-case" className="mb-4 text-h2 font-bold">
                {t('caseStudy')}
              </h2>
              <MarkdownView source={caseStudy} size="base" />
            </section>
          ) : null}
          {project.images.length > 0 ? (
            <section aria-labelledby="project-gallery">
              <h2 id="project-gallery" className="mb-4 text-h2 font-bold">
                {t('gallery')}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {project.images.map((img) => (
                  <li key={img.url}>
                    <figure>
                      <a href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                        <Image
                          src={img.url}
                          alt={loc(img, 'alt', locale)}
                          width={img.width ?? 1200}
                          height={img.height ?? 800}
                          sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                          className="h-auto w-full rounded-md border border-border"
                        />
                        <span className="sr-only">{tCommon('openInNewTab')}</span>
                      </a>
                      <figcaption className="mt-2 text-sm text-muted">
                        {loc(img, 'alt', locale)}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          {project.skills.length > 0 ? (
            <section aria-labelledby="project-stack">
              <h2
                id="project-stack"
                className="font-mono text-label tracking-widest text-note uppercase"
              >
                {t('stack')}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {project.skills.map((s) => (
                  <li key={s.id}>
                    <Chip>{s.name}</Chip>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {project.githubRepo ? (
            <section aria-labelledby="project-github">
              <h2
                id="project-github"
                className="font-mono text-label tracking-widest text-note uppercase"
              >
                {t('githubHeading')}
              </h2>
              <p className="mt-3 font-mono text-sm break-all">{project.githubRepo}</p>
              <GithubMetaLine repo={project.githubRepo} locale={locale} className="mt-2" />
            </section>
          ) : null}
        </aside>
      </div>

      {prev || next ? (
        <nav
          aria-label={t('otherProjects')}
          className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={`/projects/${prev.slug}`}
              className="group flex min-h-11 flex-col rounded-md p-2 hover:bg-surface-2"
            >
              <span className="inline-flex items-center gap-1 text-sm text-muted">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t('previous')}
              </span>
              <span className="font-semibold">{loc(prev, 'title', locale)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="group flex min-h-11 flex-col items-end rounded-md p-2 text-right hover:bg-surface-2"
            >
              <span className="inline-flex items-center gap-1 text-sm text-muted">
                {t('next')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
              <span className="font-semibold">{loc(next, 'title', locale)}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </Container>
  )
}
