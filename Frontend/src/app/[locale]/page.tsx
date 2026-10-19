import { ArrowRight, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { LiquidMaskPortrait } from '@/components/site/liquid-mask-portrait'
import { Container } from '@/components/site/section-heading'
import ContributionSkyline, { type SkylineLabels } from '@/components/ui/contribution-skyline'
import { ExperienceAccordion } from '@/features/experience/components/public/experience-accordion'
import { getPublicExperiences } from '@/features/experience/public'
import { initials, organizationName, sortByLatest } from '@/features/experience/schema'
import { getGithubContributions, githubLogin } from '@/features/profile/github-contributions'
import { getPublicProfile } from '@/features/profile/public'
import { socialLabel } from '@/features/profile/schema'
import { getPublishedProjects } from '@/features/projects/public'
import { SkillGlobe } from '@/features/skills/components/skill-globe'
import { toSkillItems } from '@/features/skills/skill-items'
import { getPublicSkills } from '@/features/skills/public'
import { Link } from '@/i18n/navigation'
import { siteUrl } from '@/lib/env'
import { DEFAULT_PHOTO_ALT, DEFAULT_PROFILE_PHOTO, HERO_PORTRAIT } from '@/lib/default-photo'
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

  const [t, tNav, tAvail, tCommon, tGlobe, tSkyline, tExp, profile, projects, skills, experiences] =
    await Promise.all([
      getTranslations({ locale, namespace: 'Home' }),
      getTranslations({ locale, namespace: 'Nav' }),
      getTranslations({ locale, namespace: 'Availability' }),
      getTranslations({ locale, namespace: 'Common' }),
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
  const skillItems = toSkillItems(skills, locale)

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

  // Potret hero: selalu foto khusus beranda (bukan foto profil dari admin).
  const portrait = (
    <Image
      src={HERO_PORTRAIT}
      alt={DEFAULT_PHOTO_ALT[locale]}
      sizes="(min-width: 1024px) 460px, (min-width: 48rem) 336px, 240px"
      loading="eager"
      placeholder="blur"
      className="hero-portrait-img"
    />
  )
  const currentRole = profile ? loc(profile, 'currentRole', locale) : ''
  const availabilityNote = profile ? loc(profile, 'availabilityNote', locale) : ''
  const socials = (['github', 'linkedin', 'instagram'] as const).flatMap((key) => {
    const href = profile?.socials[key]
    return href ? [{ key, href, label: socialLabel[key] }] : []
  })
  const stats = [
    { value: projects.length, label: t('statProjects') },
    { value: skillItems.length, label: t('statSkills') },
    { value: workHistory.length, label: t('statExperience') },
  ]

  return (
    <>
      {person ? <JsonLd data={person} /> : null}
      {/* Hero (rombak pemilik 2026-10-18, prinsip dari referensi ibnuhakim.id): nama besar di kiri, potret
          dengan liquid mask di tengah, panel status dan angka portofolio di kanan, CV dan sosial di baris
          bawah. HP: bertumpuk, nama dan potret lebih dulu. DESIGN.md bagian 83. */}
      <section
        aria-labelledby="hero-title"
        className="hero flex min-h-[calc(100svh-4rem)] flex-col"
      >
        <Container className="hero-grid flex-1">
          <div className="hero-intro">
            <p className="font-mono text-label tracking-widest text-note uppercase">
              <span aria-hidden="true">01 — </span>
              {t('heroEyebrow')}
            </p>
            <h1 id="hero-title" className="hero-name">
              {/* tiap kata satu baris; spasi di antaranya agar pembaca layar membaca nama utuh */}
              {name.split(/\s+/).map((word, i) => (
                <span key={i}>
                  {i > 0 ? ' ' : null}
                  {word}
                </span>
              ))}
            </h1>
            {profile ? (
              <dl className="hero-facts">
                {profile.city ? (
                  <div>
                    <dt>{t('locationLabel')}</dt>
                    <dd>{profile.city}</dd>
                  </div>
                ) : null}
                {currentRole ? (
                  <div>
                    <dt>{t('nowLabel')}</dt>
                    <dd>{currentRole}</dd>
                  </div>
                ) : null}
                {profile.campus ? (
                  <div>
                    <dt>{t('campusLabel')}</dt>
                    <dd>
                      {loc(profile.campus, 'title', locale)} ·{' '}
                      {organizationName(profile.campus, locale)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>

          <figure className="hero-portrait">
            <LiquidMaskPortrait>{portrait}</LiquidMaskPortrait>
            <span className="hero-portrait-hint" aria-hidden="true">
              {t('hoverHint')}
            </span>
            <Link href="/projects" className="hero-cta">
              {t('viewProjects')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </figure>

          {profile ? (
            <div className="hero-side">
              <div className="hero-card">
                <p className="hero-card-label">{t('statusLabel')}</p>
                <p className="hero-card-status">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      availabilityDot[profile.availability],
                    )}
                  />
                  {tAvail(profile.availability)}
                </p>
                {availabilityNote ? <p className="hero-card-note">{availabilityNote}</p> : null}
              </div>
              <div className="hero-card">
                <p className="hero-card-label">{t('portfolioLabel')}</p>
                <dl className="hero-stats">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <dt>{stat.label}</dt>
                      <dd>{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : null}
        </Container>

        <div className="hero-bottom">
          <Container className="hero-bottom-row">
            {profile?.hasCv ? (
              <a href={cvHref} className="hero-cv">
                <FileText aria-hidden="true" />
                <span>
                  {tNav('downloadCv')}
                  <small>PDF</small>
                </span>
              </a>
            ) : (
              <span />
            )}
            {socials.length > 0 ? (
              <ul aria-label={t('socialLabel')} className="hero-socials">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label}
                      <span className="sr-only">{tCommon('openInNewTab')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Container>
        </div>
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
                category: tGlobe('category'),
                all: tGlobe('all'),
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
