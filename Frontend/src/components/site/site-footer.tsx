import { ArrowUpRight, FileText, Globe, Mail } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getPublicProfile } from '@/features/profile/public'
import { BRAND_ICONS } from '@/features/skills/brand-icons'
import type { AppLocale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

import { type FooterLinkKey, footerLinks, isDriveHost } from './footer-links'

function BrandIcon({ slug }: { slug: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d={BRAND_ICONS[slug].path} />
    </svg>
  )
}

// Ikon kartu: logo Simple Icons bila ada; LinkedIn tidak tersedia di Simple Icons (alasan merek),
// jadi memakai tulisan "in"; email, situs, dan CV selain Google Drive memakai ikon lucide.
function LinkIcon({ name, drive }: { name: FooterLinkKey; drive: boolean }) {
  switch (name) {
    case 'whatsapp':
    case 'github':
    case 'instagram':
      return <BrandIcon slug={name} />
    case 'linkedin':
      return (
        <span className="w-5 text-center text-[17px] leading-none font-bold" aria-hidden="true">
          in
        </span>
      )
    case 'email':
      return <Mail className="size-5" aria-hidden="true" />
    case 'website':
      return <Globe className="size-5" aria-hidden="true" />
    case 'cv':
      return drive ? (
        <BrandIcon slug="googledrive" />
      ) : (
        <FileText className="size-5" aria-hidden="true" />
      )
  }
}

// Footer (pilihan pemilik 2026-10-03, demo nomor 2; DESIGN.md bagian 29): kartu tautan berisi ikon,
// nama, dan alamat untuk WhatsApp, Email, LinkedIn, GitHub, Instagram, dan Resume CV (kartu CV
// disorot). Data dari admin; kartu yang kosong tidak tampil. Di bawahnya hak cipta.
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

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        {links.length > 0 ? (
          <nav aria-labelledby="footer-contact-title" className="mb-8">
            <h2
              id="footer-contact-title"
              className="mb-4 font-display text-h3 font-semibold uppercase"
            >
              {t('contactHeading')}
            </h2>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => {
                const cv = link.key === 'cv'
                return (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={cn(
                        'group grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-3 transition-[border-color,background-color,translate] motion-safe:hover:-translate-y-0.5',
                        cv
                          ? 'border-primary bg-primary text-primary-fg hover:bg-primary/90'
                          : 'border-border bg-surface hover:border-border-strong',
                      )}
                    >
                      <LinkIcon name={link.key} drive={drive} />
                      <span className="grid min-w-0">
                        <span className="text-sm font-semibold">
                          {link.key === 'cv' ? t('cv') : tSocial(link.key)}
                        </span>
                        <span
                          className={cn(
                            'truncate text-[0.8125rem]',
                            cv ? 'text-primary-fg/75' : 'text-muted',
                          )}
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
                      {link.external ? (
                        <span className="sr-only">{tCommon('openInNewTab')}</span>
                      ) : null}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}
        <p className="text-sm text-muted">
          {t('copyright', { year: new Date().getFullYear(), name })}
        </p>
      </div>
    </footer>
  )
}
