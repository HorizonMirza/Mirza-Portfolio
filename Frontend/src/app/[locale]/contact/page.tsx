import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { IdLanyard } from '@/components/site/id-lanyard'
import { Container, PageIntro } from '@/components/site/section-heading'
import { ContactForm } from '@/features/messages/components/public/contact-form'
import { getPublicProfile } from '@/features/profile/public'
import { DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
import { siteUrl } from '@/lib/env'
import { loc } from '@/lib/localized'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Contact' })
  return pageMetadata({
    locale,
    path: '/contact',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await resolveLocale(params)
  const [t, tAvail, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Contact' }),
    getTranslations({ locale, namespace: 'Availability' }),
    getPublicProfile(),
  ])
  const availability = profile?.availability ?? 'OPEN'

  // Pilihan pemilik 2026-10-03 (demo nomor 1, tanpa tombol cepat): kartu ID bertali di kiri,
  // judul, pengantar, dan form di kanan. Kontak langsung (email, WhatsApp, sosial, CV) ada di footer.
  return (
    <Container className="pb-20">
      <div className="grid lg:grid-cols-[15rem_1fr] lg:gap-16">
        {/* tali mulai sejajar judul: margin atas sama dengan jarak atas PageIntro (md:pt-20) */}
        <IdLanyard
          className="hidden lg:mt-20 lg:block"
          name={profile?.name ?? 'Muhammad Mirza'}
          role={profile ? loc(profile, 'currentRole', locale) || null : null}
          status={tAvail(availability)}
          open={availability === 'OPEN'}
          photo={profile?.photo?.url ?? DEFAULT_PROFILE_PHOTO}
          site={new URL(siteUrl()).host}
        />
        <div>
          <PageIntro title={t('title')} intro={t('intro')} />
          <ContactForm />
        </div>
      </div>
    </Container>
  )
}
