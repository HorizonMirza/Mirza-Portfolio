'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export function LocaleSwitcher() {
  const t = useTranslations('Locale')
  const current = useLocale()
  const pathname = usePathname()

  return (
    <nav
      aria-label={t('label')}
      className="inline-flex rounded-md border border-border bg-surface p-0.5 font-mono text-xs"
    >
      {routing.locales.map((locale) => {
        const active = locale === current
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            aria-current={active ? 'true' : undefined}
            aria-label={t(locale)}
            className={cn(
              'inline-flex h-10 min-w-11 items-center justify-center rounded-sm px-2 text-muted uppercase transition-colors hover:text-text',
              active && 'bg-primary text-primary-fg hover:text-primary-fg',
            )}
          >
            {locale}
          </Link>
        )
      })}
    </nav>
  )
}
