import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, PageIntro } from '@/components/site/section-heading'
import { ContactForm } from '@/features/messages/components/public/contact-form'
import { getPublicProfile } from '@/features/profile/public'
import { SOCIAL_KEYS } from '@/features/profile/schema'
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
  const [t, tSocial, tCommon, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Contact' }),
    getTranslations({ locale, namespace: 'Social' }),
    getTranslations({ locale, namespace: 'Common' }),
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
    ...SOCIAL_KEYS.flatMap((k) =>
      profile?.socials[k]
        ? [
            {
              key: k,
              label: tSocial(k),
              href: profile.socials[k]!,
              text: tSocial(k),
              external: true,
            },
          ]
        : [],
    ),
  ]

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} intro={t('intro')} />
      <div className="grid gap-12 lg:grid-cols-[1fr_18rem]">
        <ContactForm />
        <aside aria-labelledby="contact-direct">
          <h2
            id="contact-direct"
            className="font-mono text-label tracking-widest text-muted uppercase"
          >
            {t('directHeading')}
          </h2>
          <ul className="mt-4 flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.key}>
                <a
                  href={l.href}
                  {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex min-h-11 max-w-full items-center gap-2 break-all text-primary underline-offset-4 hover:underline"
                >
                  <span className="text-muted">{l.label}</span>
                  {l.key === 'email' || l.key === 'whatsapp' ? l.text : null}
                  {l.external ? (
                    <>
                      <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="sr-only">{tCommon('openInNewTab')}</span>
                    </>
                  ) : null}
                </a>
              </li>
            ))}
            {profile?.city ? <li className="pt-2 text-muted">{profile.city}</li> : null}
          </ul>
        </aside>
      </div>
    </Container>
  )
}
