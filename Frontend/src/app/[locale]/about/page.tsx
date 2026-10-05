import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { Container, PageIntro } from '@/components/site/section-heading'
import { getPublicExperiences } from '@/features/experience/public'
import { initials, semesterNumber } from '@/features/experience/schema'
import { AboutPhotoCard } from '@/features/profile/components/about-photo-card'
import { getPublicProfile } from '@/features/profile/public'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { DEFAULT_PHOTO_ALT, DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
import { formatMonth, loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'About' })
  return pageMetadata({
    locale,
    path: '/about',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

// Halaman Tentang memakai rancangan C (pilihan pemilik 2026-10-05, DESIGN.md bagian 39): pita
// hitam dengan nama dan tombol CV, kartu foto menggantung, lalu bio di kiri dan kartu pendidikan
// di kanan. Isinya hanya bio, pendidikan, dan CV; kontak ada di halaman Kontak dan footer.
export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await resolveLocale(params)
  const [t, tCommon, profile, experiences] = await Promise.all([
    getTranslations({ locale, namespace: 'About' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublicProfile(),
    getPublicExperiences(),
  ])

  // dari yang paling lama ke terbaru, jadi SMA lalu kuliah
  const education = experiences
    .filter((e) => e.type === 'EDUCATION')
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  const current = education.find((e) => !e.end) ?? education.at(-1) ?? null

  const photo = profile?.photo ? (
    <Image
      src={profile.photo.url}
      alt={loc(profile.photo, 'alt', locale)}
      width={profile.photo.width ?? 480}
      height={profile.photo.height ?? 600}
      sizes="(min-width: 860px) 300px, 80vw"
      priority
      className="ab-pc-photo"
    />
  ) : (
    <Image
      src={DEFAULT_PROFILE_PHOTO}
      alt={DEFAULT_PHOTO_ALT[locale]}
      sizes="(min-width: 860px) 300px, 80vw"
      priority
      placeholder="blur"
      className="ab-pc-photo"
    />
  )

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} align="center" />
      <div className="ab-band">
        <AboutPhotoCard
          photo={photo}
          chip={
            current
              ? {
                  name: current.organization,
                  initials: initials(current.organization),
                  logo: current.logo,
                }
              : null
          }
          pill={
            current && !current.end ? t('semester', { n: semesterNumber(current.start) }) : null
          }
        />
        <div className="ab-band-text">
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] font-bold uppercase">
            {profile?.name ?? 'Muhammad Mirza'}
          </h2>
          <p className="text-lg tracking-wide uppercase opacity-80">{t('roles')}</p>
          {profile?.hasCv ? (
            <div>
              <a href={`/api/cv?locale=${locale}`} className="ab-cv">
                <Download className="size-4" aria-hidden="true" />
                {t('downloadCv')}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="ab-body">
        <section aria-labelledby="about-bio">
          <h2 id="about-bio" className="ab-label">
            {t('title')}
          </h2>
          {profile ? <MarkdownView source={loc(profile, 'bio', locale)} size="base" /> : null}
        </section>

        <section aria-labelledby="about-edu">
          <h2 id="about-edu" className="ab-label">
            {t('educationHeading')}
          </h2>
          {education.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-muted">
              {t('noEducation')}
            </p>
          ) : (
            <ul className="ab-edu">
              {education.map((e) => (
                <li key={e.id} className="ab-edu-card">
                  <span className="ab-edu-logo" aria-hidden="true">
                    {e.logo ? (
                      <Image
                        src={e.logo.url}
                        alt=""
                        width={128}
                        height={128}
                        sizes="64px"
                        className="size-full object-cover"
                      />
                    ) : (
                      initials(e.organization)
                    )}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl leading-[1.1] font-bold uppercase">
                      {e.organization}
                    </h3>
                    <p className="mt-1 text-muted">{loc(e, 'title', locale)}</p>
                    <p className="text-sm text-muted tabular-nums">
                      {formatMonth(e.start, locale)} –{' '}
                      {e.end ? formatMonth(e.end, locale) : tCommon('present')}
                    </p>
                    <MarkdownView
                      source={loc(e, 'description', locale)}
                      size="sm"
                      className="mt-3 text-muted"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Container>
  )
}
