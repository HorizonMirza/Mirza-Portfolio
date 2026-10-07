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
  const [t, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Contact' }),
    getPublicProfile(),
  ])

  // Pilihan pemilik 2026-10-03 (demo nomor 1, tanpa tombol cepat): kartu ID bertali di kiri,
  // judul, pengantar, dan form di kanan. Kontak langsung (email, WhatsApp, sosial, CV) ada di footer.
  return (
    <Container className="pb-12">
      <div className="grid lg:grid-cols-[15rem_1fr] lg:gap-16">
        {/* tali mulai sejajar puncak huruf judul: jarak atas PageIntro (pt-20) + mt-3 h1, ditambah
            ruang kosong di atas huruf Oswald (sekitar 0,2 ukuran huruf judul) */}
        <IdLanyard
          className="hidden lg:mt-[calc(5.75rem+0.2*var(--text-h1))] lg:block"
          name={profile?.name ?? 'Muhammad Mirza'}
          // peran diatur di admin (Profil); teks bawaan bila kosong
          role={(profile && loc(profile, 'cardRole', locale)) || t('cardRole')}
          photo={profile?.photo?.url ?? DEFAULT_PROFILE_PHOTO}
          site={new URL(siteUrl()).host}
        />
        {/* contact-col: setelah terkirim, kotak tiket selebar kalimat pengantar (globals.css) */}
        <div className="contact-col">
          <PageIntro title={t('title')} intro={t('intro')} />
          <ContactForm />
        </div>
      </div>
    </Container>
  )
}
