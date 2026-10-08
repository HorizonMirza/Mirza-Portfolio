import { ArrowUpRight, FileText, Globe, Mail } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import {
  type ContactCardLink,
  ContactCards,
  ContributionGraph,
} from '@/components/ui/contact-cards'
import { getGithubContributions, githubLogin } from '@/features/profile/github-contributions'
import { getPublicProfile } from '@/features/profile/public'
import { BRAND_ICONS } from '@/features/skills/brand-icons'
import type { AppLocale } from '@/i18n/routing'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'
import { loc } from '@/lib/localized'
import { cn } from '@/lib/utils'

import { type FooterLinkKey, footerLinks, isDriveHost } from './footer-links'

function BrandIcon({ slug, className = 'size-5' }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={BRAND_ICONS[slug].path} />
    </svg>
  )
}

// Ikon kartu: logo Simple Icons bila ada; LinkedIn tidak tersedia di Simple Icons (alasan merek),
// jadi memakai tulisan "in"; email, situs, dan CV selain Google Drive memakai ikon lucide.
function LinkIcon({ name, drive }: { name: FooterLinkKey; drive: boolean }) {
  const size = 'size-5'
  switch (name) {
    case 'whatsapp':
    case 'github':
    case 'instagram':
      return <BrandIcon slug={name} className={size} />
    case 'linkedin':
      return (
        <span className="w-5 text-center text-[17px] leading-none font-bold" aria-hidden="true">
          in
        </span>
      )
    case 'email':
      return <Mail className={size} aria-hidden="true" />
    case 'website':
      return <Globe className={size} aria-hidden="true" />
    case 'cv':
      return drive ? (
        <BrandIcon slug="googledrive" className={size} />
      ) : (
        <FileText className={size} aria-hidden="true" />
      )
  }
}

// Isi kartu sederhana di baris kontak desktop: ikon, nama, nilai, dan keterangan singkat.
function SimpleCard({
  icon,
  title,
  value,
  hint,
}: {
  icon: ReactNode
  title: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex w-72 items-start gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2">
        {icon}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="truncate text-sm text-muted">{value}</span>
        {hint ? <span className="text-xs text-note">{hint}</span> : null}
      </span>
    </div>
  )
}

// Footer (pilihan pemilik 2026-10-03, demo nomor 2; DESIGN.md bagian 29): kartu tautan berisi ikon,
// nama, dan alamat untuk WhatsApp, Email, LinkedIn, GitHub, Instagram, dan Resume CV (kartu CV
// disorot). Data dari admin; kartu yang kosong tidak tampil. Di bawahnya hak cipta.
// Revisi pemilik 2026-10-08: daftar kartu tetap seperti sebelumnya; saat sebuah kartu disorot,
// kartu detailnya muncul di atasnya dan bergeser mengikuti kartu yang disorot
// (components/ui/contact-cards.tsx). Kartu GitHub memuat kalender kontribusi yang sama dengan
// beranda. HP tidak punya hover, jadi tidak berubah.
export async function SiteFooter({ locale }: { locale: AppLocale }) {
  const [t, tSocial, tCommon, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Footer' }),
    getTranslations({ locale, namespace: 'Social' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublicProfile(),
  ])
  const name = profile?.name ?? 'Muhammad Mirza'
  const links = profile ? footerLinks(profile, { locale, fileLabel: t('cvFile') }) : []
  const drive = isDriveHost(profile?.cvHost ?? null)
  const login = githubLogin(profile?.socials.github)
  const contributions = login ? await getGithubContributions(login) : null
  const avatar = profile?.photo?.url ?? DEFAULT_PROFILE_AVATAR
  const roles = profile
    ? loc(profile, 'aboutRoles', locale) || loc(profile, 'currentRole', locale)
    : ''

  const avatarImage = (size: number, className?: string) => (
    <Image
      src={avatar}
      alt=""
      width={size * 2}
      height={size * 2}
      sizes={`${size}px`}
      className={cn('shrink-0 rounded-full object-cover', className)}
      style={{ width: size, height: size }}
    />
  )

  function cardFor(link: (typeof links)[number]): ReactNode {
    const icon = <LinkIcon name={link.key} drive={drive} />
    switch (link.key) {
      case 'whatsapp':
        return (
          <SimpleCard icon={icon} title="WhatsApp" value={link.value} hint={t('whatsappHint')} />
        )
      case 'email':
        return <SimpleCard icon={icon} title="Email" value={link.value} hint={t('emailHint')} />
      case 'linkedin':
        return (
          <div className="w-72">
            <div className="h-16 bg-[linear-gradient(135deg,var(--surface-2),color-mix(in_srgb,var(--text)_22%,var(--surface-2)))]" />
            <div className="flex flex-col gap-1 px-4 pt-2 pb-4">
              <div className="-mt-11 mb-1 w-fit rounded-full ring-4 ring-surface">
                {avatarImage(56)}
              </div>
              <span className="font-semibold">{name}</span>
              {roles ? <span className="text-sm text-muted">{roles}</span> : null}
              <span className="text-xs text-note">linkedin.com/in/{link.value}</span>
            </div>
          </div>
        )
      case 'github':
        return (
          <div className="flex w-[min(22rem,calc(100vw-4rem))] flex-col gap-3 p-3">
            <div className="flex items-center gap-3">
              {avatarImage(40)}
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{link.value}</span>
                <span className="text-sm text-muted">
                  {contributions
                    ? t('contributions', { count: contributions.total })
                    : t('githubHint')}
                </span>
              </div>
            </div>
            {contributions ? (
              <ContributionGraph
                weeks={contributions.weeks}
                locale={locale}
                countLabel={{ one: t('contributionOne'), other: t('contributionOther') }}
              />
            ) : null}
          </div>
        )
      case 'cv':
        return <SimpleCard icon={icon} title={t('cv')} value={link.value} hint={t('cvHint')} />
      default:
        return <SimpleCard icon={icon} title={tSocial(link.key)} value={link.value} />
    }
  }

  const cardLinks: ContactCardLink[] = links.map((link) => {
    const cv = link.key === 'cv'
    return {
      key: link.key,
      href: link.href,
      external: link.external,
      className: cn(
        'group grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-3 transition-[border-color,background-color,translate] motion-safe:hover:-translate-y-0.5',
        cv
          ? 'border-primary bg-primary text-primary-fg hover:bg-primary/90'
          : 'border-border bg-surface hover:border-border-strong',
      ),
      trigger: (
        <>
          <LinkIcon name={link.key} drive={drive} />
          <span className="grid min-w-0">
            <span className="text-sm font-semibold">
              {link.key === 'cv' ? t('cv') : tSocial(link.key)}
            </span>
            <span
              className={cn('truncate text-[0.8125rem]', cv ? 'text-primary-fg/75' : 'text-muted')}
            >
              {link.value}
            </span>
          </span>
          <ArrowUpRight
            className={cn(
              'size-4 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5',
              cv ? 'text-primary-fg/75' : 'text-muted',
            )}
            aria-hidden="true"
          />
          {link.external ? <span className="sr-only">{tCommon('openInNewTab')}</span> : null}
        </>
      ),
      card: cardFor(link),
    }
  })

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        {links.length > 0 ? (
          <nav aria-labelledby="footer-contact-title" className="mb-4">
            <h2
              id="footer-contact-title"
              className="mb-4 font-display text-h3 font-semibold uppercase"
            >
              {t('contactHeading')}
            </h2>
            <ContactCards links={cardLinks} />
          </nav>
        ) : null}
        <p className="text-sm text-muted">
          {t('copyright', { year: new Date().getFullYear(), name })}
        </p>
      </div>
    </footer>
  )
}
