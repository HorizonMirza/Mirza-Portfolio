import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, PageIntro } from '@/components/site/section-heading'
import { Link } from '@/i18n/navigation'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { formatDateShort } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

// Perbarui tanggal ini setiap kali isi kebijakan berubah.
const UPDATED_AT = '2026-10-01T00:00:00Z'

const SECTIONS = ['visits', 'contact', 'newsletter', 'cv', 'services', 'rights'] as const

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Privacy' })
  return pageMetadata({
    locale,
    path: '/privacy',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'Privacy' })
  return (
    <Container className="pb-20">
      <PageIntro
        eyebrow={t('updated', { date: formatDateShort(UPDATED_AT, locale) })}
        title={t('title')}
        intro={t('intro')}
      />
      <div className="flex max-w-prose flex-col gap-8">
        {SECTIONS.map((s) => (
          <section key={s} aria-labelledby={`privacy-${s}`}>
            <h2 id={`privacy-${s}`} className="text-h3 font-semibold">
              {t(`${s}Heading`)}
            </h2>
            <p className="mt-2 text-muted">{t(`${s}Body`)}</p>
          </section>
        ))}
        <p>
          <Link href="/contact" className="text-primary underline underline-offset-4">
            {t('contactLink')}
          </Link>
        </p>
      </div>
    </Container>
  )
}
