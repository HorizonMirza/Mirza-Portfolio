import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { Chip } from '@/components/site/section-heading'
import type { PublicProjectSummary } from '@/features/projects/public'
import type { AppLocale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import { loc } from '@/lib/localized'
import { cn } from '@/lib/utils'

import { GithubMetaLine } from './github-meta'

// Kartu project. "wide" dipakai saat hanya ada satu project agar halaman tidak terasa kosong.
export async function ProjectCard({
  project,
  index,
  locale,
  variant = 'grid',
  headingLevel = 'h3',
}: {
  project: PublicProjectSummary
  index: number
  locale: AppLocale
  variant?: 'grid' | 'wide'
  headingLevel?: 'h2' | 'h3'
}) {
  const t = await getTranslations({ locale, namespace: 'Projects' })
  const title = loc(project, 'title', locale)
  const Heading = headingLevel
  const wide = variant === 'wide'

  return (
    <article
      className={cn(
        'reveal group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-colors hover:border-border-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary dark:shadow-none',
        wide && 'md:grid md:grid-cols-[1.1fr_1fr]',
      )}
    >
      <div
        className={cn('relative aspect-[16/9] bg-surface-2', wide && 'md:aspect-auto md:min-h-72')}
      >
        {project.cover ? (
          <Image
            src={project.cover.url}
            alt={loc(project.cover, 'alt', locale)}
            fill
            sizes={
              wide
                ? '(min-width: 768px) 600px, 100vw'
                : '(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw'
            }
            className="object-cover"
          />
        ) : (
          // Tanpa sampul: bidang tipografi dengan nomor project, bukan ilustrasi generik.
          <div
            aria-hidden="true"
            className="project-cover-fallback absolute inset-0 flex items-end p-5"
          >
            <span className="font-mono text-display leading-none font-bold text-border-strong/40">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
      <div className={cn('flex flex-1 flex-col gap-3 p-5', wide && 'md:p-8')}>
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-label tracking-widest text-note uppercase">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span aria-hidden="true">·</span>
          <span>{t(project.category)}</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
        </p>
        <Heading className={cn('font-semibold', wide ? 'text-h2' : 'text-h3')}>
          {/* Seluruh kartu dapat diklik lewat pseudo-element, tautan tetap satu untuk pembaca layar. */}
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {title}
          </Link>
        </Heading>
        <p className={cn('text-muted', !wide && 'text-sm')}>{loc(project, 'summary', locale)}</p>
        {project.skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t('stack')}>
            {project.skills.map((s) => (
              <li key={s.id}>
                <Chip>{s.name}</Chip>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <GithubMetaLine repo={project.githubRepo} locale={locale} />
          <span
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            aria-hidden="true"
          >
            {t('readMoreShort')}
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  )
}
