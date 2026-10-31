import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, PageIntro } from '@/components/site/section-heading'
import { getPrivacyEditedAt } from '@/features/site-text/public'
import { Link } from '@/i18n/navigation'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { formatDateShort } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

// Tanggal perubahan teks bawaan (messages/*.json); perbarui setiap kali isi bawaan kebijakan diubah
// di kode. Suntingan lewat admin dihitung otomatis dari SiteText (getPrivacyEditedAt).
const DEFAULT_TEXT_UPDATED_AT = '2026-10-31T00:00:00Z'

const SECTIONS = ['visits', 'contact', 'newsletter', 'cv', 'services', 'rights', 'credits'] as const

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
  const [t, editedAt] = await Promise.all([
    getTranslations({ locale, namespace: 'Privacy' }),
    getPrivacyEditedAt(),
  ])
  // yang lebih baru di antara perubahan teks bawaan dan suntingan admin
  const updatedAt =
    editedAt && editedAt > DEFAULT_TEXT_UPDATED_AT ? editedAt : DEFAULT_TEXT_UPDATED_AT
  return (
    <Container className="pb-20">
      <PageIntro
        eyebrow={t('updated', { date: formatDateShort(updatedAt, locale) })}
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
