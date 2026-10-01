'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

// Satu tombol bulat yang berpindah ke bahasa lain di halaman yang sama. Kode yang terlihat
// (mis. "EN") adalah bahasa tujuan dan ikut tercantum di nama aksesibel.
// Animasi (globals.css .lang-code): kode berputar keluar saat ditekan, kode baru berputar masuk
// setelah halaman berganti bahasa. Mati pada reduced-motion.
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('Locale')
  const current = useLocale()
  const pathname = usePathname()
  const [leaving, setLeaving] = useState(false)
  const target = routing.locales.find((locale) => locale !== current) ?? routing.defaultLocale
  const label = t('switchTo', { language: t(target), code: target.toUpperCase() })

  return (
    <Link
      href={pathname}
      locale={target}
      hrefLang={target}
      aria-label={label}
      title={label}
      onClick={() => setLeaving(true)}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface font-mono text-xs font-medium text-text uppercase transition-colors [perspective:200px] hover:bg-surface-2',
        className,
      )}
    >
      <span key={current} className="lang-code" data-leaving={leaving ? '' : undefined}>
        {target}
      </span>
    </Link>
  )
}
