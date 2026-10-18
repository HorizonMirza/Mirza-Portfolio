import { ArrowRight, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { HorizonBackdrop } from '@/components/site/horizon-backdrop'
import { Container } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import ContributionSkyline, { type SkylineLabels } from '@/components/ui/contribution-skyline'
import { ExperienceAccordion } from '@/features/experience/components/public/experience-accordion'
import { getPublicExperiences } from '@/features/experience/public'
import { initials, organizationName, sortByLatest } from '@/features/experience/schema'
import { getGithubContributions, githubLogin } from '@/features/profile/github-contributions'
import { getPublicProfile } from '@/features/profile/public'
import { getPublishedProjects } from '@/features/projects/public'
import { SkillGlobe } from '@/features/skills/components/skill-globe'
import { toSkillItems } from '@/features/skills/skill-items'
import { getPublicSkills } from '@/features/skills/public'
import { Link } from '@/i18n/navigation'
import { siteUrl } from '@/lib/env'
import { DEFAULT_PHOTO_ALT, DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
import { JsonLd } from '@/lib/json-ld'
import { routing } from '@/i18n/routing'
import { formatMonth, loc } from '@/lib/localized'
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
    tGlobe,
    tSkyline,
    tExp,
    profile,
    projects,
    skills,
    experiences,
  ] = await Promise.all([
    getTranslations({ locale, namespace: 'Home' }),
    getTranslations({ locale, namespace: 'Nav' }),
    getTranslations({ locale, namespace: 'Availability' }),
    getTranslations({ locale, namespace: 'Common' }),
    getTranslations({ locale, namespace: 'Skills' }),
    getTranslations({ locale, namespace: 'SkillGlobe' }),
    getTranslations({ locale, namespace: 'Skyline' }),
    getTranslations({ locale, namespace: 'Experience' }),
    getPublicProfile(),
    getPublishedProjects(),
    getPublicSkills(),
    getPublicExperiences(),
  ])

  const name = profile?.name ?? 'Muhammad Mirza'
  const github = profile?.socials.github
  const login = githubLogin(github)
  const contributions = login ? await getGithubContributions(login) : null
  const numberLocale = locale === 'id' ? 'id-ID' : 'en-US'
  const cvHref = `/api/cv?locale=${locale}`
  // Teks grafik kontribusi dua bahasa (komponen klien hanya menerima string, bukan fungsi).
  const skylineKeys = [
    'unit',
    'unitPlural',
    'none',
    'inLastYear',
    'on',
    'busiest',
    'longest',
    'current',
    'day',
    'days',
    'less',
    'more',
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
  // Pengalaman di beranda (revisi pemilik 2026-10-16, demo E3 akordion): kerja dan organisasi
  // terbaru di atas, pendidikan tidak ikut (sama dengan halaman Pengalaman)
  const workHistory = sortByLatest(experiences.filter((e) => e.type !== 'EDUCATION'))
  const sections = [
    workHistory.length > 0 && 'experience',
    showcaseCovers.length > 1 && 'projects',
    skills.length > 0 && 'stack',
    contributions && github && 'github',
  ].filter((key): key is string => Boolean(key))
  const skillItems = toSkillItems(skills, locale, (slug) => projectTitles.get(slug) ?? slug)

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

      {sections.includes('experience') ? (
        <section
          aria-labelledby="experience-title"
          className="home-curtain reveal border-t border-border py-16 md:py-24"
        >
          {/* Transisi antarbagian "judul tirai" (pilihan pemilik 2026-10-16, demo T3): judul naik dari
              balik batasnya, isi bagian menyusul memudar. Diatur .home-curtain di globals.css. */}
          {/* Revisi pemilik 2026-10-16: tanpa nomor bagian dan tanpa tautan "Semua pengalaman",
              judul di tengah seperti bagian Project */}
          <Container>
            <h2 id="experience-title" className="mb-8 text-center text-h2 font-bold">
              <span>{t('experienceHeading')}</span>
            </h2>
            {/* Akordion <details> bawaan browser: tanpa JavaScript, bisa dipakai keyboard dan
                pembaca layar. Semua tertutup di awal, tanpa ikon +/× (revisi pemilik 2026-10-16). */}
            <ExperienceAccordion>
              {workHistory.map((e) => {
                const org = organizationName(e, locale)
                const when = `${formatMonth(e.start, locale)} - ${
                  e.end ? formatMonth(e.end, locale) : tExp('present')
                }`
                return (
                  <details key={e.id} className="home-xp">
                    <summary>
                      <span className="home-xp-logo" aria-hidden="true">
                        {e.logo ? (
                          <Image
                            src={e.logo.url}
                            alt=""
                            width={88}
                            height={88}
                            sizes="44px"
                            className="size-full object-cover"
                          />
                        ) : (
                          <span>{initials(e.organization)}</span>
                        )}
                      </span>
                      <span className="home-xp-head">
                        <span className="home-xp-role">{loc(e, 'title', locale)}</span>
                        <span className="home-xp-org">
                          {org}
                          {e.employmentType ? ` · ${tExp(`employment.${e.employmentType}`)}` : ''}
                        </span>
                        <span className="home-xp-when home-xp-when-inline">{when}</span>
                      </span>
                      <span className="home-xp-when home-xp-when-side">{when}</span>
                    </summary>
                    {/* tiap poin satu baris di layar lebar, tanpa batas lebar teks (revisi pemilik
                        2026-10-16); di HP tetap turun baris */}
                    <MarkdownView
                      source={loc(e, 'description', locale)}
                      size="base"
                      className="home-xp-body text-muted sm:max-w-none"
                    />
                  </details>
                )
              })}
            </ExperienceAccordion>
          </Container>
        </section>
      ) : null}

      {sections.includes('projects') ? (
        <section
          aria-labelledby="projects-title"
          className="home-curtain reveal border-t border-border py-16 md:py-24"
        >
          {/* Revisi pemilik 2026-10-16: tanpa nomor bagian, judul "Project" di tengah, tanpa tautan
              "Semua project" dan tanpa deretan nama; letaknya di bawah Pengalaman. */}
          <Container>
            <h2 id="projects-title" className="mb-8 text-center text-h2 font-bold">
              <span>{t('projectsHeading')}</span>
            </h2>
          </Container>
          {/* Pita sampul berjalan (pilihan pemilik 2026-10-15): tiap sampul kini tautan ke halaman
              detail project dan pita tidak berhenti saat disorot (revisi 2026-10-16). Deret diulang
              dua kali agar putaran tidak terputus; salinan kedua disembunyikan dari pembaca layar
              dan keyboard. Pita berhenti saat ada fokus keyboard di dalamnya agar tautan bisa dipilih. */}
          <div className="home-marquee">
            <ul
              className="home-marquee-track"
              aria-label={t('projectList')}
              style={{ '--n': showcaseCovers.length } as CSSProperties}
            >
              {[0, 1].map((copy) =>
                showcaseCovers.map((c) => (
                  <li key={`${c.slug}-${copy}`} aria-hidden={copy === 1 ? true : undefined}>
                    <Link
                      href={`/projects/${c.slug}`}
                      transitionTypes={['project-open']}
                      tabIndex={copy === 1 ? -1 : undefined}
                    >
                      {/* nama muncul di tengah sampul saat disorot; di layar sentuh nama tampil di
                          bawah sampul (pilihan pemilik 2026-10-16, demo N5) */}
                      <span className="home-marquee-cover">
                        <Image src={c.url} alt="" fill sizes="(min-width: 640px) 360px, 240px" />
                        <span className="home-marquee-hover">{c.title}</span>
                      </span>
                      <span className="home-marquee-caption">{c.title}</span>
                    </Link>
                  </li>
                )),
              )}
            </ul>
          </div>
        </section>
      ) : null}

      {sections.includes('stack') ? (
        <section
          id="skills"
          aria-labelledby="stack-title"
          className="home-curtain reveal scroll-mt-24 border-t border-border py-16 md:py-24"
        >
          <Container>
            {/* Revisi pemilik 2026-10-16: tanpa nomor bagian, judul di tengah; keterangan sumber
                logo ada di halaman Privasi (bagian Kredit) */}
            <h2 id="stack-title" className="mb-4 text-center text-h2 font-bold">
              <span>{t('stackHeading')}</span>
            </h2>
            <SkillGlobe
              items={skillItems}
              categories={skills.map((c) => loc(c, 'name', locale))}
              labels={{
                globe: tGlobe('label'),
                list: tGlobe('list'),
                categories: tGlobe('categories'),
                usedIn: tSkills('usedIn'),
              }}
            />
          </Container>
        </section>
      ) : null}

      {sections.includes('github') ? (
        <section
          aria-labelledby="github-title"
          className="home-curtain reveal border-t border-border py-16 md:py-24"
        >
          <Container>
            {/* Revisi pemilik 2026-10-16: judul "GitHub" di tengah tanpa nomor, tanpa tautan profil
                dan tanpa baris aktivitas terbaru; tinggal grafik kontribusi */}
            <h2 id="github-title" className="mb-8 text-center text-h2 font-bold">
              <span>{t('githubHeading')}</span>
            </h2>
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
