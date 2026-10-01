'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { originOf, revealNextPage, supportsCrossDocumentReveal } from '@/lib/circle-reveal'
import { cn } from '@/lib/utils'

// Satu tombol bulat yang berpindah ke bahasa lain di halaman yang sama. Kode yang terlihat
// (mis. "EN") adalah bahasa tujuan dan ikut tercantum di nama aksesibel.
// Animasi: halaman bahasa baru meluas melingkar dari tombol (lib/circle-reveal.ts), dan kode bahasa
// berubah seperti kata yang berganti (globals.css .lang-code). Mati pada reduced-motion.
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
      onClick={(event) => {
        setLeaving(true)
        // halaman bahasa baru meluas melingkar dari tombol ini, sama seperti ganti tema.
        // Browser tanpa dukungan: navigasi biasa dari Link.
        if (!supportsCrossDocumentReveal()) return
        event.preventDefault()
        const origin = originOf(event.currentTarget)
        const href = event.currentTarget.href
        // beri waktu kode bahasa lama memudar sebelum halaman berganti
        window.setTimeout(() => revealNextPage(origin, href), 180)
      }}
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
