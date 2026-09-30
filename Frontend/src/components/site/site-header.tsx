import { Download } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { getPublicProfile } from '@/features/profile/public'
import type { AppLocale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'

import { MobileMenu } from './mobile-menu'
import { NavLinks } from './nav-links'

export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const [t, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Nav' }),
    getPublicProfile(),
  ])
  const cvHref = `/api/cv?locale=${locale}`

  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-bg">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-mono text-sm font-medium tracking-wide"
        >
          MM
          <span className="sr-only">{profile?.name ?? 'Muhammad Mirza'}</span>
        </Link>
        <nav aria-label={t('label')} className="hidden lg:block">
          <NavLinks className="flex items-center gap-1" />
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <LocaleSwitcher />
            <ThemeToggle />
            {profile?.hasCv ? (
              <Button asChild size="sm">
                <a href={cvHref}>
                  <Download aria-hidden="true" />
                  {t('downloadCv')}
                </a>
              </Button>
            ) : null}
          </div>
          <MobileMenu>
            <nav aria-label={t('label')} className="mt-4">
              <NavLinks className="flex flex-col gap-1" linkClassName="w-full text-h3 text-text" />
            </nav>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            {profile?.hasCv ? (
              <Button asChild className="mt-6 w-full">
                <a href={cvHref}>
                  <Download aria-hidden="true" />
                  {t('downloadCv')}
                </a>
              </Button>
            ) : null}
          </MobileMenu>
        </div>
      </div>
    </header>
  )
}
