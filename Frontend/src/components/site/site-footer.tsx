import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { SOCIAL_KEYS } from '@/features/profile/schema'
import { getPublicProfile } from '@/features/profile/public'
import type { AppLocale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'

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
        <nav aria-label={t('social')}>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {socials.map((s) => (
              <li key={s.key}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-muted underline-offset-4 hover:text-text hover:underline"
                >
                  {tSocial(s.key)}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">{tCommon('openInNewTab')}</span>
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center text-muted underline-offset-4 hover:text-text hover:underline"
              >
                {t('privacy')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
