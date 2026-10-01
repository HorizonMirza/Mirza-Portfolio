import { Globe } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { SOCIAL_KEYS } from '@/features/profile/schema'
import { getPublicProfile } from '@/features/profile/public'
import { BRAND_ICONS } from '@/features/skills/brand-icons'
import type { AppLocale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'

type SocialKey = (typeof SOCIAL_KEYS)[number]

// Ikon tautan sosial: logo Simple Icons bila ada; LinkedIn tidak tersedia di Simple Icons
// (alasan merek), jadi memakai tulisan "in"; situs pribadi memakai ikon globe.
function SocialIcon({ name }: { name: SocialKey }) {
  if (name === 'website') return <Globe className="size-[18px]" aria-hidden="true" />
  if (name === 'linkedin')
    return (
      <span className="text-[15px] leading-none font-bold" aria-hidden="true">
        in
      </span>
    )
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
      <path d={BRAND_ICONS[name].path} />
    </svg>
  )
}

// Footer: hak cipta di kiri; di kanan tautan sosial berupa tombol ikon bulat (seperti tombol topbar)
// dan tautan kebijakan privasi.
export async function SiteFooter({ locale }: { locale: AppLocale }) {
  const [t, tSocial, tCommon, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Footer' }),
    getTranslations({ locale, namespace: 'Social' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublicProfile(),
  ])
  const name = profile?.name ?? 'Muhammad Mirza'
  const socials = SOCIAL_KEYS.flatMap((key) =>
    profile?.socials[key] ? [{ key, url: profile.socials[key]! }] : [],
  )

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="text-sm text-muted">
          <p>{t('copyright', { year: new Date().getFullYear(), name })}</p>
          <p className="mt-1">{t('builtWith')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {socials.length > 0 ? (
            <nav aria-label={t('social')}>
              <ul className="flex flex-wrap items-center gap-2">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={tSocial(s.key)}
                      className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-text"
                    >
                      <SocialIcon name={s.key} />
                      <span className="sr-only">
                        {tSocial(s.key)} {tCommon('openInNewTab')}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:text-text hover:underline"
          >
            {t('privacy')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
