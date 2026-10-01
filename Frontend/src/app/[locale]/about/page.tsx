import { ArrowRight, ArrowUpRight, Download } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { Container, PageIntro } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import { getPublicProfile } from '@/features/profile/public'
import { SOCIAL_KEYS } from '@/features/profile/schema'
import { Link } from '@/i18n/navigation'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { DEFAULT_PHOTO_ALT, DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
import { loc } from '@/lib/localized'
import { pageMetadata, whatsappUrl } from '@/lib/seo'

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

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await resolveLocale(params)
  const [t, tSocial, tCommon, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'About' }),
    getTranslations({ locale, namespace: 'Social' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublicProfile(),
  ])

  const contacts: { key: string; label: string; value: string; href: string; external: boolean }[] =
    []
  if (profile?.email)
    contacts.push({
      key: 'email',
      label: tSocial('email'),
      value: profile.email,
      href: `mailto:${profile.email}`,
      external: false,
    })
  if (profile?.whatsapp)
    contacts.push({
      key: 'whatsapp',
      label: tSocial('whatsapp'),
      value: profile.whatsapp,
      href: whatsappUrl(profile.whatsapp),
      external: true,
    })
  for (const key of SOCIAL_KEYS) {
    const url = profile?.socials[key]
    if (url)
      contacts.push({
        key,
        label: tSocial(key),
        value: url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
        href: url,
        external: true,
      })
  }

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} />
      <div className="grid gap-10 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-16">
        <div>
          {profile?.photo ? (
            <Image
              src={profile.photo.url}
              alt={loc(profile.photo, 'alt', locale)}
              width={profile.photo.width ?? 480}
              height={profile.photo.height ?? 600}
              sizes="(min-width: 768px) 288px, 100vw"
              priority
              className="aspect-[4/5] w-full max-w-72 rounded-lg border border-border object-cover"
            />
          ) : (
            <Image
              src={DEFAULT_PROFILE_PHOTO}
              alt={DEFAULT_PHOTO_ALT[locale]}
              sizes="(min-width: 768px) 288px, 100vw"
              priority
              placeholder="blur"
              className="aspect-[4/5] w-full max-w-72 rounded-lg border border-border object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-10">
          {profile ? <MarkdownView source={loc(profile, 'bio', locale)} size="base" /> : null}

          <section aria-labelledby="about-contact">
            <h2
              id="about-contact"
              className="font-mono text-label tracking-widest text-note uppercase"
            >
              {t('contactHeading')}
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
              {profile?.city ? (
                <>
                  <dt className="text-muted">{t('city')}</dt>
                  <dd>{profile.city}</dd>
                </>
              ) : null}
              {contacts.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="text-muted">{c.label}</dt>
                  <dd className="min-w-0">
                    <a
                      href={c.href}
                      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="inline-flex max-w-full items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
                    >
                      {c.value}
                      {c.external ? (
                        <>
                          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="sr-only">{tCommon('openInNewTab')}</span>
                        </>
                      ) : null}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            {profile?.hasCv ? (
              <Button asChild>
                <a href={`/api/cv?locale=${locale}`}>
                  <Download aria-hidden="true" />
                  {t('downloadCv')}
                </a>
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link href="/experience">
                {t('journeyLink')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
