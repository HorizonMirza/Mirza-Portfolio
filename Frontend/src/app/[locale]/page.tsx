import { ArrowRight, Download } from 'lucide-react'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { HorizonBackdrop } from '@/components/site/horizon-backdrop'
import { Container, SectionHeading } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import ContributionSkyline, { type SkylineLabels } from '@/components/ui/contribution-skyline'
import { getPublicExperiences } from '@/features/experience/public'
import { organizationName } from '@/features/experience/schema'
import { CountUp } from '@/features/highlights/components/count-up'
import { getPublicHighlights } from '@/features/highlights/public'
import {
  GithubActivityTicker,
  type TickerItem,
} from '@/features/profile/components/github-activity-ticker'
import { type GithubActivity, getGithubActivity } from '@/features/profile/github-activity'
import { getGithubContributions, githubLogin } from '@/features/profile/github-contributions'
import { getPublicProfile } from '@/features/profile/public'
import { getPublishedProjects } from '@/features/projects/public'
import { SkillKeyboard } from '@/features/skills/components/skill-keyboard'
import { SkillKeyboard3D } from '@/features/skills/components/skill-keyboard-3d'
import { toKeycaps } from '@/features/skills/keycaps'
import { getPublicSkills } from '@/features/skills/public'
import { Link } from '@/i18n/navigation'
import { siteUrl } from '@/lib/env'
import { DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
import { JsonLd } from '@/lib/json-ld'
import { routing } from '@/i18n/routing'
import { loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'
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
  OPEN: 'bg-note',
  BUSY: 'bg-danger',
  NOT_LOOKING: 'bg-border-strong',
} as const

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [
    t,
    tNav,
    tAvail,
    tCommon,
    tSkills,
    tKeyboard,
    tSkyline,
    tActivity,
    profile,
    projects,
    skills,
    highlights,
    experiences,
  ] = await Promise.all([
    getTranslations({ locale, namespace: 'Home' }),
    getTranslations({ locale, namespace: 'Nav' }),
    getTranslations({ locale, namespace: 'Availability' }),
    getTranslations({ locale, namespace: 'Common' }),
    getTranslations({ locale, namespace: 'Skills' }),
    getTranslations({ locale, namespace: 'SkillKeyboard' }),
    getTranslations({ locale, namespace: 'Skyline' }),
    getTranslations({ locale, namespace: 'GithubActivity' }),
    getPublicProfile(),
    getPublishedProjects(),
    getPublicSkills(),
    getPublicHighlights(),
    getPublicExperiences(),
  ])

  const name = profile?.name ?? 'Muhammad Mirza'
  const github = profile?.socials.github
  const login = githubLogin(github)
  const [contributions, activity] = login
    ? await Promise.all([getGithubContributions(login), getGithubActivity(login)])
    : [null, [] as GithubActivity[]]
  const numberLocale = locale === 'id' ? 'id-ID' : 'en-US'
  // garis cerita: titik yang dicentang di admin, dari yang terlama
  const story = experiences
    .filter((e) => e.inStory)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  const tickerItems: TickerItem[] = activity.map((a) => ({
    badge: tActivity(activityBadge[a.kind]),
    // repo milik sendiri cukup namanya ("Mirza-Portfolio"), agar muat di HP
    text: activityText(
      {
        ...a,
        repo: login && a.repo.startsWith(`${login}/`) ? a.repo.slice(login.length + 1) : a.repo,
      },
      tActivity,
    ),
    href: `https://github.com/${a.repo}`,
    at: a.at,
  }))
  const cvHref = `/api/cv?locale=${locale}`
  // Teks grafik kontribusi dua bahasa (komponen klien hanya menerima string, bukan fungsi).
  const skylineKeys = [
    'unit',
    'unitPlural',
    'none',
    'inLastYear',
    'on',
    'total',
    'busiest',
    'longest',
    'current',
    'day',
    'days',
    'hint2d',
    'hint3d',
    'less',
    'more',
    'level1',
    'level2',
    'level3',
    'level4',
    'highlight',
    'view',
    'flat',
    'skyline',
    'keys',
  ] as const satisfies readonly (keyof SkylineLabels)[]
  const skylineLabels = Object.fromEntries(
    skylineKeys.map((key) => [key, tSkyline(key)]),
  ) as SkylineLabels
  const contributionDays = contributions
    ? contributions.weeks.flat().map((day) => ({ date: day.date, count: day.count }))
    : []
  const projectTitles = new Map(projects.map((p) => [p.slug, loc(p, 'title', locale)]))
  const skillKeycaps = toKeycaps(skills, locale, (slug) => projectTitles.get(slug) ?? slug)

  // Data terstruktur Person (schema.org) untuk mesin pencari. Hanya data publik, tanpa email/WhatsApp.
  const person = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        url: `${siteUrl()}/${locale}`,
        description: loc(profile, 'headline', locale),
        jobTitle: loc(profile, 'currentRole', locale) || undefined,
        image: profile.photo?.url ?? new URL(DEFAULT_PROFILE_PHOTO.src, siteUrl()).toString(),
        sameAs: Object.values(profile.socials),
        address: profile.city
          ? { '@type': 'PostalAddress', addressLocality: profile.city, addressCountry: 'ID' }
          : undefined,
        alumniOf: profile.campus
          ? { '@type': 'CollegeOrUniversity', name: organizationName(profile.campus, locale) }
          : undefined,
      }
    : null

  return (
    <>
      {person ? <JsonLd data={person} /> : null}
      <section aria-labelledby="hero-title" className="flex min-h-[calc(100svh-4rem)] flex-col">
        <Container className="flex flex-1 flex-col justify-center gap-8 pt-10 pb-8 md:pt-16">
          <div>
            <p className="font-mono text-label tracking-widest text-note uppercase">
              <span aria-hidden="true">01 — </span>
              {name}
            </p>
            <h1 id="hero-title" className="mt-4 max-w-5xl text-display font-bold text-balance">
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
                <dt className="font-mono text-label tracking-widest text-note uppercase">
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
                    <dt className="font-mono text-label tracking-widest text-note uppercase">
                      {t('locationLabel')}
                    </dt>
                    <dd>{profile.city}</dd>
                  </>
                ) : null}
                {profile.campus ? (
                  <>
                    <dt className="font-mono text-label tracking-widest text-note uppercase">
                      {t('campusLabel')}
                    </dt>
                    <dd>
                      {organizationName(profile.campus, locale)}
                      <span className="text-muted"> · {loc(profile.campus, 'title', locale)}</span>
                    </dd>
                  </>
                ) : null}
                {loc(profile, 'currentRole', locale) ? (
                  <>
                    <dt className="font-mono text-label tracking-widest text-note uppercase">
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

      {highlights.length > 0 ? (
        <section aria-labelledby="numbers-title" className="border-t border-border py-16 md:py-24">
          <Container className="reveal">
            <SectionHeading id="numbers-title" index="02" title={t('highlightsHeading')} />
            <ul className="home-stats">
              {highlights.map((h) => (
                <li key={h.id}>
                  <CountUp
                    value={h.value}
                    suffix={h.suffix}
                    locale={numberLocale}
                    className="home-stat-value"
                  />
                  <span className="home-stat-label">{loc(h, 'label', locale)}</span>
                  {h.source ? <span className="home-stat-source">{h.source}</span> : null}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {story.length > 1 ? (
        <section aria-labelledby="story-title" className="border-t border-border py-16 md:py-24">
          <Container className="reveal">
            <SectionHeading id="story-title" index="03" title={t('storyHeading')} />
            <ol className="home-story" style={{ '--n': story.length } as CSSProperties}>
              {story.map((e, i) => (
                <li
                  key={e.id}
                  className={cn(i === story.length - 1 && !e.end && 'is-now')}
                  style={{ '--i': i } as CSSProperties}
                >
                  <span className="home-story-year">{e.start.slice(0, 4)}</span>
                  <span className="home-story-org">{organizationName(e, locale)}</span>
                  <span className="home-story-role">{loc(e, 'title', locale)}</span>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {skills.length > 0 ? (
        <section
          id="skills"
          aria-labelledby="stack-title"
          className="scroll-mt-24 border-t border-border py-16 md:py-24"
        >
          <Container className="reveal">
            <SectionHeading id="stack-title" index="04" title={t('stackHeading')} />
            <SkillKeyboard3D
              keycaps={skillKeycaps}
              label={tKeyboard('label')}
              fallback={
                <SkillKeyboard
                  keycaps={skillKeycaps}
                  labels={{
                    keyboard: tKeyboard('label'),
                    hint: tKeyboard('hint'),
                    usedIn: tSkills('usedIn'),
                  }}
                />
              }
            />
            <p className="mt-6 text-xs text-muted">{tKeyboard('credit')}</p>
          </Container>
        </section>
      ) : null}

      {contributions && github ? (
        <section aria-labelledby="github-title" className="border-t border-border py-16 md:py-24">
          <Container className="reveal">
            <SectionHeading
              id="github-title"
              index="05"
              title={t('githubHeading')}
              action={
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t('githubProfile')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">{tCommon('openInNewTab')}</span>
                </a>
              }
            />
            {tickerItems.length > 0 ? (
              <GithubActivityTicker
                items={tickerItems}
                locale={numberLocale}
                labels={{
                  region: tActivity('region'),
                  pause: tActivity('pause'),
                  play: tActivity('play'),
                }}
              />
            ) : null}
            <ContributionSkyline
              data={contributionDays}
              locale={numberLocale}
              labels={skylineLabels}
            />
          </Container>
        </section>
      ) : null}
    </>
  )
}

const activityBadge = {
  push: 'badgePush',
  createRepo: 'badgeRepo',
  createBranch: 'badgeBranch',
  createTag: 'badgeTag',
  release: 'badgeRelease',
  pullOpened: 'badgePull',
  pullMerged: 'badgePull',
  public: 'badgePublic',
  star: 'badgeStar',
  fork: 'badgeFork',
} as const satisfies Record<GithubActivity['kind'], string>

type ActivityT = Awaited<ReturnType<typeof getTranslations<'GithubActivity'>>>

function activityText(a: GithubActivity, t: ActivityT): string {
  switch (a.kind) {
    case 'push':
      return t('push', { repo: a.repo, branch: a.branch })
    case 'createBranch':
    case 'createTag':
      return t(a.kind, { repo: a.repo, ref: a.ref })
    case 'release':
      return t('release', { repo: a.repo, tag: a.tag })
    case 'pullOpened':
    case 'pullMerged':
      return t(a.kind, { repo: a.repo, number: a.number })
    default:
      return t(a.kind, { repo: a.repo })
  }
}
