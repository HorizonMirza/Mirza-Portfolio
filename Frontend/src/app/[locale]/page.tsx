import type { Metadata } from 'next'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { NeuralVortexBackground } from '@/components/shared/neural-vortex-background'
import { LiquidMaskPortrait } from '@/components/site/liquid-mask-portrait'
import { Container } from '@/components/site/section-heading'
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
import {
  DEFAULT_PHOTO_ALT,
  DEFAULT_PROFILE_PHOTO,
  HERO_ARMOR,
  HERO_ARMOR_BLEED,
  HERO_PORTRAIT,
} from '@/lib/default-photo'
import { JsonLd } from '@/lib/json-ld'
import { routing } from '@/i18n/routing'
import { formatMonth, loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

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

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [t, tGlobe, tSkyline, tExp, profile, projects, skills, experiences] = await Promise.all([
    getTranslations({ locale, namespace: 'Home' }),
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
      sizes="(min-width: 1024px) 860px, 100vw"
      loading="eager"
      // tanpa placeholder blur: versi buram foto transparan tampil sebagai kotak kemerahan di belakang foto
      // saat halaman dimuat ulang (laporan pemilik 2026-10-19)
      draggable={false}
      className="hero-portrait-img"
    />
  )
  // peran dari profil (kolom Peran di Tentang, dipisah "|"), di pojok bawah hero (demo peran 3)
  const roles = (profile ? loc(profile, 'aboutRoles', locale) : '')
    .split('|')
    .map((r) => r.trim())
    .filter(Boolean)
  const nameWords = name.split(/\s+/)
  // Baris pertama kata pertama, sisanya baris kedua; spasi agar pembaca layar membaca nama utuh.
  // Kata pertama dibagi tiga (mis. MUH·AM·MAD): bagian tengah diberi ruang selebar wajah agar sisi
  // kiri dan kanannya sejajar dan utuh di kiri-kanan wajah (revisi pemilik 2026-10-19).
  const first = nameWords[0] ?? ''
  const edge = Math.max(0, Math.floor((first.length - 2) / 2))
  const nameLines = (
    <>
      <span>
        {first.slice(0, edge)}
        <span className="hero-name-mid">{first.slice(edge, first.length - edge)}</span>
        {first.slice(first.length - edge)}
      </span>
      {nameWords.length > 1 ? <span> {nameWords.slice(1).join(' ')}</span> : null}
    </>
  )

  return (
    <>
      {person ? <JsonLd data={person} /> : null}
      {/* Hero (revisi pemilik 2026-10-19, DESIGN.md bagian 85 dan 86): foto besar tanpa bingkai rata
          bawah, nama dua baris memudar ke bawah di belakang dan di depan foto. Salinan depan dilubangi di
          area wajah (demo 5) agar nama terbaca tanpa menutupi wajah. Liquid mask di seluruh hero. */}
      {/* Hero memanjang ke belakang navbar (hero-shell) agar efek hover bereaksi sampai navbar; isinya di
          .hero, tepat di bawah navbar. Latar vortex redup (pilihan pemilik 2026-10-19, latar 9). */}
      <section aria-labelledby="hero-title" className="hero-shell">
        <LiquidMaskPortrait back={HERO_ARMOR.src} bleed={HERO_ARMOR_BLEED}>
          <NeuralVortexBackground className="hero-vortex" />
          <div className="hero">
            {/* halo lembut di belakang kepala (demo cahaya 1 pilihan pemilik) */}
            <div aria-hidden="true" className="hero-glow" />
            <h1 id="hero-title" className="hero-name">
              {nameLines}
            </h1>
            <figure className="hero-portrait">{portrait}</figure>
            <div aria-hidden="true" className="hero-name-front">
              <p className="hero-name">{nameLines}</p>
            </div>
            {roles.length > 0 ? (
              <ul className="hero-roles">
                {roles.map((role) => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </LiquidMaskPortrait>
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
