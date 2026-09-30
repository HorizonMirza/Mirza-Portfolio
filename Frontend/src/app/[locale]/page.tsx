import { ArrowRight, Download, MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { HorizonBackdrop } from '@/components/site/horizon-backdrop'
import { Chip, Container, SectionHeading } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import { getPublicExperiences } from '@/features/experience/public'
import { getPublicProfile } from '@/features/profile/public'
import { ProjectCard } from '@/features/projects/components/public/project-card'
import { getPublishedProjects } from '@/features/projects/public'
import { getPublicSkills } from '@/features/skills/public'
import { NewsletterForm } from '@/features/subscribers/components/newsletter-form'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { formatMonth, loc } from '@/lib/localized'
import { pageMetadata, whatsappUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const [t, tMeta] = await Promise.all([
    getTranslations({ locale, namespace: 'Home' }),
    getTranslations({ locale, namespace: 'Metadata' }),
  ])
  return pageMetadata({
    locale,
    path: '/',
    title: t('metaTitle'),
    description: tMeta('description'),
    absoluteTitle: true,
  })
}

const availabilityDot = {
  OPEN: 'bg-success',
  BUSY: 'bg-danger',
  NOT_LOOKING: 'bg-border-strong',
} as const

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [t, tNav, tAvail, tCommon, tExp, profile, projects, experiences, skills] =
    await Promise.all([
      getTranslations({ locale, namespace: 'Home' }),
      getTranslations({ locale, namespace: 'Nav' }),
      getTranslations({ locale, namespace: 'Availability' }),
      getTranslations({ locale, namespace: 'Common' }),
      getTranslations({ locale, namespace: 'Experience' }),
      getPublicProfile(),
      getPublishedProjects(),
      getPublicExperiences(),
      getPublicSkills(),
    ])

  const name = profile?.name ?? 'Muhammad Mirza'
  const featured = (
    projects.some((p) => p.featured) ? projects.filter((p) => p.featured) : projects
  ).slice(0, 3)
  const github = profile?.socials.github
  const cvHref = `/api/cv?locale=${locale}`

  return (
    <>
      <section aria-labelledby="hero-title" className="flex min-h-[calc(100svh-4rem)] flex-col">
        <Container className="flex flex-1 flex-col justify-center gap-8 pt-10 pb-8 md:pt-16">
          <div>
            <p className="font-mono text-label tracking-widest text-muted uppercase">
              <span aria-hidden="true">01 — </span>
              {name}
            </p>
            <h1
              id="hero-title"
              className="mt-4 max-w-4xl text-display font-bold tracking-tight text-balance"
            >
              {profile ? loc(profile, 'headline', locale) : name}
            </h1>
          </div>

          {/* Di HP tombol tampil sebelum pelat status agar "Unduh CV" terlihat tanpa scroll (PRD U1). */}
          <div className="flex flex-col gap-8 lg:flex-col-reverse">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {profile?.hasCv ? (
                <Button asChild>
                  <a href={cvHref}>
                    <Download aria-hidden="true" />
                    {tNav('downloadCv')}
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="secondary">
                <Link href="/projects">
                  {t('viewProjects')}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              {github ? (
                <Button asChild variant="ghost">
                  <a href={github} target="_blank" rel="noopener noreferrer">
                    {t('github')}
                    <span className="sr-only">{tCommon('openInNewTab')}</span>
                  </a>
                </Button>
              ) : null}
            </div>

            {profile ? (
              <dl
                aria-label={t('statusPlate')}
                className="grid max-w-2xl gap-x-6 gap-y-3 rounded-lg border border-border bg-surface/80 p-4 text-sm sm:grid-cols-[auto_1fr] dark:bg-surface/60"
              >
                <dt className="font-mono text-label tracking-widest text-muted uppercase">
                  {t('statusLabel')}
                </dt>
                <dd className="flex items-center gap-2 font-medium">
                  <span
                    aria-hidden="true"
                    className={cn('size-2 rounded-full', availabilityDot[profile.availability])}
                  />
                  {tAvail(profile.availability)}
                  {loc(profile, 'availabilityNote', locale) ? (
                    <span className="font-normal text-muted">
                      · {loc(profile, 'availabilityNote', locale)}
                    </span>
                  ) : null}
                </dd>
                {profile.city ? (
                  <>
                    <dt className="font-mono text-label tracking-widest text-muted uppercase">
                      {t('locationLabel')}
                    </dt>
                    <dd>{profile.city}</dd>
                  </>
                ) : null}
                {profile.campus ? (
                  <>
                    <dt className="font-mono text-label tracking-widest text-muted uppercase">
                      {t('campusLabel')}
                    </dt>
                    <dd>
                      {profile.campus.organization}
                      <span className="text-muted"> · {loc(profile.campus, 'title', locale)}</span>
                    </dd>
                  </>
                ) : null}
                {loc(profile, 'currentRole', locale) ? (
                  <>
                    <dt className="font-mono text-label tracking-widest text-muted uppercase">
                      {t('nowLabel')}
                    </dt>
                    <dd>{loc(profile, 'currentRole', locale)}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
          </div>
        </Container>
        <HorizonBackdrop />
      </section>

      <section aria-labelledby="featured-title" className="py-16 md:py-24">
        <Container>
          <SectionHeading
            id="featured-title"
            index="02"
            title={t('featuredHeading')}
            action={
              projects.length > 1 ? (
                <Link
                  href="/projects"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t('allProjects')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null
            }
          />
          {featured.length === 0 ? (
            <p className="max-w-prose rounded-lg border border-dashed border-border p-6 text-muted">
              {t('noProjects')}{' '}
              {github ? (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  GitHub
                  <span className="sr-only"> {tCommon('openInNewTab')}</span>
                </a>
              ) : null}
            </p>
          ) : featured.length === 1 ? (
            <ProjectCard project={featured[0]!} index={0} locale={locale} variant="wide" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((project, i) => (
                <ProjectCard key={project.slug} project={project} index={i} locale={locale} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {experiences.length > 0 ? (
        <section aria-labelledby="journey-title" className="border-t border-border py-16 md:py-24">
          <Container>
            <SectionHeading
              id="journey-title"
              index="03"
              title={t('journeyHeading')}
              action={
                <Link
                  href="/experience"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t('journeyMore')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
            <ol className="divide-y divide-border border-y border-border">
              {experiences.slice(0, 3).map((e) => (
                <li
                  key={e.id}
                  className="grid gap-1 py-5 md:grid-cols-[12rem_1fr_auto] md:items-baseline md:gap-6"
                >
                  <p className="font-mono text-sm text-muted tabular-nums">
                    {formatMonth(e.start, locale)} –{' '}
                    {e.end ? formatMonth(e.end, locale) : tCommon('present')}
                  </p>
                  <div>
                    <h3 className="font-semibold">{loc(e, 'title', locale)}</h3>
                    <p className="text-muted">{e.organization}</p>
                  </div>
                  <p className="font-mono text-label tracking-widest text-muted uppercase">
                    {tExp(e.type)}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {skills.length > 0 ? (
        <section aria-labelledby="stack-title" className="border-t border-border py-16 md:py-24">
          <Container>
            <SectionHeading
              id="stack-title"
              index="04"
              title={t('stackHeading')}
              action={
                <Link
                  href="/skills"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t('stackMore')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
            <dl className="grid gap-6 md:grid-cols-3">
              {skills.map((c) => (
                <div key={c.id}>
                  <dt className="font-mono text-label tracking-widest text-muted uppercase">
                    {loc(c, 'name', locale)}
                  </dt>
                  <dd className="mt-3">
                    <ul className="flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <li key={s.id}>
                          <Chip>{s.name}</Chip>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>
      ) : null}

      <section aria-labelledby="cta-title" className="border-t border-border py-16 md:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionHeading id="cta-title" index="05" title={t('ctaHeading')} className="mb-4" />
            <p className="max-w-prose text-muted">{t('ctaBody')}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/contact">
                  <MessageSquare aria-hidden="true" />
                  {t('ctaMessage')}
                </Link>
              </Button>
              {profile?.whatsapp ? (
                <Button asChild variant="secondary">
                  <a href={whatsappUrl(profile.whatsapp)} target="_blank" rel="noopener noreferrer">
                    {t('ctaWhatsapp')}
                    <span className="sr-only">{tCommon('openInNewTab')}</span>
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <NewsletterForm />
        </Container>
      </section>
    </>
  )
}
