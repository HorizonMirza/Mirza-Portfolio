import { ArrowUpRight } from 'lucide-react'
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
import { pageMetadata, whatsappUrl } from '@/lib/seo'

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
  const [t, tSocial, tCommon, tAvail, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Contact' }),
    getTranslations({ locale, namespace: 'Social' }),
    getTranslations({ locale, namespace: 'Common' }),
    getTranslations({ locale, namespace: 'Availability' }),
    getPublicProfile(),
  ])
  const links = [
    ...(profile?.email
      ? [
          {
            key: 'email',
            label: tSocial('email'),
            href: `mailto:${profile.email}`,
            text: profile.email,
            external: false,
          },
        ]
      : []),
    ...(profile?.whatsapp
      ? [
          {
            key: 'whatsapp',
            label: tSocial('whatsapp'),
            href: whatsappUrl(profile.whatsapp),
            text: profile.whatsapp,
            external: true,
          },
        ]
      : []),
  ]

  // tautan sosial (GitHub, LinkedIn, dll.) ada di footer; di sini hanya kontak langsung
  const availability = profile?.availability ?? 'OPEN'

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} intro={t('intro')} />
      <div className="grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-16">
        {/* kartu ID bertali di kiri form (desktop) */}
        <IdLanyard
          className="hidden lg:block"
          name={profile?.name ?? 'Muhammad Mirza'}
          role={profile ? loc(profile, 'currentRole', locale) || null : null}
          status={tAvail(availability)}
          open={availability === 'OPEN'}
          photo={profile?.photo?.url ?? DEFAULT_PROFILE_PHOTO}
          site={new URL(siteUrl()).host}
        />
        <div className="flex flex-col gap-10">
          <ContactForm />
          {links.length > 0 || profile?.city ? (
            <aside aria-labelledby="contact-direct">
              <h2
                id="contact-direct"
                className="font-mono text-label tracking-widest text-note uppercase"
              >
                {t('directHeading')}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                {links.map((l) => (
                  <li key={l.key}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="inline-flex min-h-11 max-w-full items-center gap-2 break-all text-primary underline-offset-4 hover:underline"
                    >
                      <span className="text-muted">{l.label}</span>
                      {l.text}
                      {l.external ? (
                        <>
                          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="sr-only">{tCommon('openInNewTab')}</span>
                        </>
                      ) : null}
                    </a>
                  </li>
                ))}
                {profile?.city ? (
                  <li className="inline-flex min-h-11 items-center text-muted">{profile.city}</li>
                ) : null}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </Container>
  )
}
