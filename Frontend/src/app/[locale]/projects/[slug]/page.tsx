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
import { cn } from '@/lib/utils'

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
  // gambar galeri pertama tampil besar di samping ubin teknologi; sisanya di bawah
  const [lead, ...gallery] = project.images

  const links =
    project.demoUrl || project.repoUrl ? (
      <>
        {project.demoUrl ? (
          <Button asChild className="pj-btn-solid">
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              {t('demo')}
              <span className="sr-only">{tCommon('openInNewTab')}</span>
            </a>
          </Button>
        ) : null}
        {project.repoUrl ? (
          <Button asChild variant="secondary" className="pj-btn-ghost">
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              <Code2 aria-hidden="true" />
              {t('repo')}
              <span className="sr-only">{tCommon('openInNewTab')}</span>
            </a>
          </Button>
        ) : null}
      </>
    ) : null

  const intro = (
    <>
      <p className="pj-eyebrow flex flex-wrap gap-x-2 font-mono text-label tracking-widest uppercase">
        <span>{t(project.category)}</span>
        <span aria-hidden="true">·</span>
        <span>{project.year}</span>
      </p>
      <h1 className="mt-3 max-w-4xl text-display font-bold">{loc(project, 'title', locale)}</h1>
      <p className="pj-summary mt-4 max-w-prose text-body">{loc(project, 'summary', locale)}</p>
      {links ? <div className="mt-6 flex flex-col gap-3 sm:flex-row">{links}</div> : null}
    </>
  )

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

      {/* Pilihan pemilik 2026-10-08 (demo 3): judul, ringkasan, dan tombol di atas gambar sampul
          (gambar sedikit membesar saat digulir), baris info, lalu ubin bento yang muncul bergantian.
          Tanpa sampul: kepala halaman biasa. */}
      {project.cover ? (
        <header className="pj-hero mt-6">
          <Image
            src={project.cover.url}
            alt={loc(project.cover, 'alt', locale)}
            fill
            sizes="(min-width: 1200px) 1136px, 100vw"
            priority
            className="pj-hero-img object-cover"
          />
          <div className="pj-hero-in">{intro}</div>
        </header>
      ) : (
        <header className="pt-6 pb-4">{intro}</header>
      )}

      <dl className="pj-meta reveal mt-8">
        <div>
          <dt>{t('category')}</dt>
          <dd>{t(project.category)}</dd>
        </div>
        <div>
          <dt>{t('year')}</dt>
          <dd>{project.year}</dd>
        </div>
        {project.skills.length > 0 ? (
          <div>
            <dt>{t('stack')}</dt>
            <dd>{project.skills.map((s) => s.name).join(', ')}</dd>
          </div>
        ) : null}
        {project.githubRepo ? (
          <div>
            <dt>{t('githubHeading')}</dt>
            <dd className="font-mono text-sm break-all">{project.githubRepo}</dd>
          </div>
        ) : null}
      </dl>

      <div className="pj-bento mt-4">
        {lead ? (
          <figure className="pj-tile pj-pic pj-s4 reveal">
            <Image
              src={lead.url}
              alt={loc(lead, 'alt', locale)}
              width={lead.width ?? 1600}
              height={lead.height ?? 900}
              sizes="(min-width: 1024px) 740px, 100vw"
              className="size-full object-cover"
            />
          </figure>
        ) : null}
        <section
          aria-labelledby="project-stack"
          className={cn('pj-tile pj-inv reveal flex flex-col', lead ? 'pj-s2' : 'pj-s6')}
        >
          <h2 id="project-stack" className="pj-label">
            {t('stack')}
          </h2>
          {project.skills.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <li key={s.id}>
                  <Chip className="border-current/30 bg-transparent text-current">{s.name}</Chip>
                </li>
              ))}
            </ul>
          ) : null}
          {project.githubRepo ? (
            <GithubMetaLine repo={project.githubRepo} locale={locale} className="mt-4" />
          ) : null}
          {/* tahun besar di dasar ubin, seperti ubin angka di demo pilihan pemilik */}
          <p className="mt-auto pt-8">
            <span className="block font-display text-[3.5rem] leading-none font-bold">
              {project.year}
            </span>
            <span className="pj-label mt-2 block">{t(project.category)}</span>
          </p>
        </section>

        <section
          aria-labelledby="project-overview"
          className={cn('pj-tile reveal', caseStudy ? 'pj-s3' : 'pj-s6')}
        >
          <h2 id="project-overview" className="pj-tile-title">
            {t('overview')}
          </h2>
          <MarkdownView source={loc(project, 'description', locale)} size="base" />
        </section>
        {caseStudy ? (
          <section aria-labelledby="project-case" className="pj-tile pj-s3 reveal">
            <h2 id="project-case" className="pj-tile-title">
              {t('caseStudy')}
            </h2>
            <MarkdownView source={caseStudy} size="base" />
          </section>
        ) : null}

        {gallery.length > 0 ? <h2 className="sr-only">{t('gallery')}</h2> : null}
        {gallery.map((img, i) => (
          <figure
            key={img.url}
            className={cn(
              'pj-tile pj-pic reveal',
              i === gallery.length - 1 && gallery.length % 2 === 1 ? 'pj-s6' : 'pj-s3',
            )}
          >
            <a href={img.url} target="_blank" rel="noopener noreferrer" className="block size-full">
              <Image
                src={img.url}
                alt={loc(img, 'alt', locale)}
                width={img.width ?? 1200}
                height={img.height ?? 800}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="size-full object-cover"
              />
              <span className="sr-only">{tCommon('openInNewTab')}</span>
            </a>
          </figure>
        ))}
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
