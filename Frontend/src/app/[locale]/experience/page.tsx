import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { Container, PageIntro } from '@/components/site/section-heading'
import { FocusTimeline } from '@/features/experience/components/public/focus-timeline'
import { getPublicExperiences, type PublicExperience } from '@/features/experience/public'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { formatMonth, loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/experience'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Experience' })
  return pageMetadata({
    locale,
    path: '/experience',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

// Halaman ini hanya pengalaman kerja dan organisasi; pendidikan tidak ditampilkan (pilihan
// pemilik 2026-10-03). Data pendidikan tetap dipakai halaman Tentang.
const SHOWN = ['WORK', 'ORGANIZATION'] as const

function monthsBetween(start: string, end: string | null) {
  const [sy, sm] = start.split('-').map(Number)
  const now = new Date()
  const [ey, em] = end ? end.split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1]
  return Math.max(1, (ey - sy) * 12 + (em - sm) + 1)
}

// Inisial instansi untuk simpul timeline bila logo belum diunggah ("PT PGAS Solution" → "PS").
function initials(organization: string) {
  const words = organization
    .replace(/^PT\s+/i, '')
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter((w) => /^[A-Z0-9]/.test(w))
  return (
    words
      .slice(0, 2)
      .map((w) => w[0])
      .join('') || organization.slice(0, 2).toUpperCase()
  )
}

// Timeline tengah "fokus aktif" (pilihan pemilik 2026-10-03, DESIGN.md bagian 38): hitam-putih,
// tanpa kalimat pengantar dan tanpa filter (revisi pemilik).
export default async function ExperiencePage({ params }: PageProps<'/[locale]/experience'>) {
  const locale = await resolveLocale(params)
  const [t, tCommon, all] = await Promise.all([
    getTranslations({ locale, namespace: 'Experience' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublicExperiences(),
  ])
  const items = all.filter((e) => (SHOWN as readonly string[]).includes(e.type))

  const duration = (e: PublicExperience) => {
    const n = monthsBetween(e.start, e.end)
    const years = Math.floor(n / 12)
    const months = n % 12
    return [
      years ? t('durationYears', { count: years }) : '',
      months ? t('durationMonths', { count: months }) : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} />
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-muted">{t('none')}</p>
      ) : (
        <FocusTimeline label={t('listLabel')}>
          {items.map((e) => {
            const logoAlt = e.logo ? loc(e.logo, 'alt', locale) || e.organization : ''
            return (
              <li key={e.id} data-type={e.type} data-current={e.end ? undefined : ''}>
                <div className="xp-node" aria-hidden={e.logo ? undefined : true}>
                  {e.logo ? (
                    <Image
                      src={e.logo.url}
                      alt={logoAlt}
                      width={112}
                      height={112}
                      sizes="56px"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span>{initials(e.organization)}</span>
                  )}
                </div>
                <div className="xp-main">
                  <p className="font-mono text-sm text-muted tabular-nums">
                    {e.end ? null : <span className="xp-now" aria-hidden="true" />}
                    {formatMonth(e.start, locale)} –{' '}
                    {e.end ? formatMonth(e.end, locale) : tCommon('present')}
                    <span className="ml-3 text-label tracking-widest uppercase">{t(e.type)}</span>
                  </p>
                  <h2 className="mt-2 text-h3 font-semibold">{loc(e, 'title', locale)}</h2>
                  <p className="text-muted">
                    {e.organization}
                    {e.location ? ` · ${e.location}` : ''}
                  </p>
                  <MarkdownView
                    source={loc(e, 'description', locale)}
                    size="base"
                    className="xp-desc mt-3 text-muted"
                  />
                </div>
                <div className="xp-side">
                  {e.photo ? (
                    <Image
                      src={e.photo.url}
                      alt={loc(e.photo, 'alt', locale)}
                      width={e.photo.width ?? 800}
                      height={e.photo.height ?? 600}
                      sizes="(min-width: 1024px) 320px, (min-width: 768px) 40vw, 100vw"
                      className="xp-photo"
                    />
                  ) : (
                    <p className="xp-year">
                      <span className="font-display text-[2.75rem] leading-none font-bold">
                        {e.start.slice(0, 4)}
                      </span>
                      <span className="mt-2 block font-mono text-label tracking-widest uppercase">
                        {duration(e)}
                      </span>
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </FocusTimeline>
      )}
    </Container>
  )
}
