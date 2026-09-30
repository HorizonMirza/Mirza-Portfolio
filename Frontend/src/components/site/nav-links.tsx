'use client'

import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { isSiteNavActive, siteNav } from './nav-items'

export function NavLinks({
  className,
  linkClassName,
}: {
  className?: string
  linkClassName?: string
}) {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  return (
    <ul className={className}>
      {siteNav.map((item) => {
        const active = isSiteNavActive(pathname, item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted transition-colors hover:text-text',
                active && 'text-text underline decoration-primary decoration-2 underline-offset-8',
                linkClassName,
              )}
            >
              {t(item.key)}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
