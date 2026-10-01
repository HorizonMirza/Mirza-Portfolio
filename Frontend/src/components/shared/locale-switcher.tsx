'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

// Satu tombol bulat yang berpindah ke bahasa lain di halaman yang sama. Kode yang terlihat
// (mis. "EN") adalah bahasa tujuan dan ikut tercantum di nama aksesibel.
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('Locale')
  const current = useLocale()
  const pathname = usePathname()
  const target = routing.locales.find((locale) => locale !== current) ?? routing.defaultLocale
  const label = t('switchTo', { language: t(target), code: target.toUpperCase() })

  return (
    <Link
      href={pathname}
      locale={target}
      hrefLang={target}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-xs font-medium text-text uppercase transition-colors hover:bg-surface-2',
        className,
      )}
    >
      {target}
    </Link>
  )
}
