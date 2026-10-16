import { ArrowRight, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { HorizonBackdrop } from '@/components/site/horizon-backdrop'
import { Container, SectionHeading } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import ContributionSkyline, { type SkylineLabels } from '@/components/ui/contribution-skyline'
import { organizationName } from '@/features/experience/schema'
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
import { DEFAULT_PHOTO_ALT, DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
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
  ])

  const name = profile?.name ?? 'Muhammad Mirza'
  const github = profile?.socials.github
  const login = githubLogin(github)
  const [contributions, activity] = login
    ? await Promise.all([getGithubContributions(login), getGithubActivity(login)])
    : [null, [] as GithubActivity[]]
  const numberLocale = locale === 'id' ? 'id-ID' : 'en-US'
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
  // Project pilihan (audit Home 2026-10-15): yang bertanda unggulan di depan, lalu urutan admin.
  // Pita gambar butuh minimal dua sampul agar ada yang mengalir.
  const showcase = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)]
  const showcaseCovers = showcase.flatMap((p) =>
    p.cover ? [{ slug: p.slug, url: p.cover.url, title: loc(p, 'title', locale) }] : [],
  )

  // Nomor bagian dihitung dari bagian yang benar-benar tampil, agar tidak melompat bila satu bagian
  // kosong (mis. semua angka dihapus di admin). 01 selalu bagian pembuka.
  const sections = [
    showcaseCovers.length > 1 && 'projects',
    skills.length > 0 && 'stack',
    contributions && github && 'github',
  ].filter((key): key is string => Boolean(key))
  const sectionIndex = (key: string) => String(sections.indexOf(key) + 2).padStart(2, '0')
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

  // Foto potret hero: foto dari admin bila ada, selain itu foto bawaan pemilik.
  const portraitSizes = '(min-width: 1024px) 400px, 64px'
  const portrait = profile?.photo ? (
    <Image
      src={profile.photo.url}
      alt={loc(profile.photo, 'alt', locale)}
      width={profile.photo.width ?? 480}
      height={profile.photo.height ?? 600}
      sizes={portraitSizes}
      loading="eager"
      className="home-portrait-img"
    />
  ) : (
    <Image
      src={DEFAULT_PROFILE_PHOTO}
      alt={DEFAULT_PHOTO_ALT[locale]}
      sizes={portraitSizes}
      loading="eager"
      placeholder="blur"
      className="home-portrait-img"
    />
  )
  // keterangan di bawah foto (hanya laptop): kota dan kampus dari profil
  const portraitCaption = [
    profile?.city,
    profile?.campus ? organizationName(profile.campus, locale) : null,
  ].filter((part): part is string => Boolean(part))

  return (
    <>
      {person ? <JsonLd data={person} /> : null}
      <section aria-labelledby="hero-title" className="flex min-h-[calc(100svh-4rem)] flex-col">
        {/* Laptop: teks di kiri, foto potret di kanan (audit Home nomor 2, pilihan pemilik 2026-10-15
            demo 1). HP: foto bulat kecil di atas nama. */}
        <Container className="grid flex-1 content-center gap-6 pt-10 pb-8 md:pt-16 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-center lg:gap-14">
          <figure className="home-portrait lg:order-last">
            <div className="home-portrait-frame">{portrait}</div>
            {portraitCaption.length > 0 ? (
              <figcaption className="home-portrait-cap">
                {portraitCaption.map((part) => (
                  <span key={part}>{part}</span>
                ))}
              </figcaption>
            ) : null}
          </figure>
          <div className="flex min-w-0 flex-col gap-8">
            <div>
              <p className="font-mono text-label tracking-widest text-note uppercase">
                <span aria-hidden="true">01 — </span>
                {name}
              </p>
              <h1 id="hero-title" className="mt-4 max-w-5xl text-display font-bold text-balance">
                {profile ? loc(profile, 'headline', locale) : name}
              </h1>
            </div>

            {/* Di HP tombol tampil sebelum pelat status agar tombol Resume CV terlihat tanpa scroll (PRD U1). */}
            <div className="flex flex-col gap-8 lg:flex-col-reverse">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {profile?.hasCv ? (
                  <Button asChild>
                    <a href={cvHref}>
                      <FileText aria-hidden="true" />
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
                  <dd className="flex items-start gap-2 font-medium">
                    {/* titik setinggi baris pertama; status dan catatan mengalir sebagai satu kalimat
                      agar di HP tidak terbelah menjadi dua kolom sempit */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-[0.45em] size-2 shrink-0 rounded-full',
                        availabilityDot[profile.availability],
                      )}
                    />
                    <span>
                      {tAvail(profile.availability)}
                      {loc(profile, 'availabilityNote', locale) ? (
                        <span className="font-normal text-muted">
                          {' '}
                          · {loc(profile, 'availabilityNote', locale)}
                        </span>
                      ) : null}
                    </span>
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
                        <span className="text-muted">
                          {' '}
                          · {loc(profile.campus, 'title', locale)}
                        </span>
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
          </div>
        </Container>
        <HorizonBackdrop />
      </section>

      {sections.includes('projects') ? (
        <section aria-labelledby="projects-title" className="border-t border-border py-16 md:py-24">
          <Container className="reveal">
            <SectionHeading
              id="projects-title"
              index={sectionIndex('projects')}
              title={t('projectsHeading')}
              action={
                <Link
                  href="/projects"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t('allProjects', { count: projects.length })}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
          </Container>
          {/* Pita sampul datar yang berjalan pelan (pilihan pemilik 2026-10-15, demo ringan nomor 1):
              dekoratif dan tidak bisa difokus; tautannya di deretan nama di bawah. Deret diulang dua
              kali agar putarannya tidak terputus; satu animasi CSS, tanpa JavaScript. */}
          <div className="home-marquee" aria-hidden="true">
            <div
              className="home-marquee-track"
              style={{ '--n': showcaseCovers.length } as CSSProperties}
            >
              {[...showcaseCovers, ...showcaseCovers].map((c, i) => (
                <figure key={`${c.slug}-${i}`}>
                  <Image src={c.url} alt="" fill sizes="(min-width: 640px) 360px, 240px" />
                  <figcaption>{c.title}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <Container>
            <ul aria-label={t('projectList')} className="home-project-links">
              {showcase.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`}>{loc(p, 'title', locale)}</Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {sections.includes('stack') ? (
        <section
          id="skills"
          aria-labelledby="stack-title"
          className="scroll-mt-24 border-t border-border py-16 md:py-24"
        >
          <Container className="reveal">
            <SectionHeading
              id="stack-title"
              index={sectionIndex('stack')}
              title={t('stackHeading')}
            />
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

      {sections.includes('github') ? (
        <section aria-labelledby="github-title" className="border-t border-border py-16 md:py-24">
          <Container className="reveal">
            <SectionHeading
              id="github-title"
              index={sectionIndex('github')}
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
