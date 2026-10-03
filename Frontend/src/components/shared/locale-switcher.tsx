'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { LANG_SCRAMBLE_KEY, visibleTexts } from '@/lib/text-scramble'
import { playLanguageSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

// Satu tombol bulat yang berpindah ke bahasa lain di halaman yang sama. Kode yang terlihat
// (mis. "EN") adalah bahasa tujuan dan ikut tercantum di nama aksesibel.
// Animasi: setelah halaman berganti bahasa, teks yang terlihat (termasuk kode di tombol ini) diacak
// lalu terurai ke bahasa baru (lib/text-scramble.ts lewat LanguageScramble di layout), diiringi
// suara acak digital (lib/ui-sounds.ts).
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
      // tetap di posisi gulir yang sama setelah ganti bahasa (permintaan pemilik 2026-10-03)
      scroll={false}
      aria-label={label}
      title={label}
      onClick={() => {
        playLanguageSound(target === 'en')
        try {
          sessionStorage.setItem(
            LANG_SCRAMBLE_KEY,
            JSON.stringify({ at: Date.now(), texts: visibleTexts() }),
          )
        } catch {
          // sessionStorage diblokir: tetap pindah bahasa, hanya tanpa animasi
        }
      }}
      className={cn(
        // huruf sama dengan menu utama (Inter semibold), bukan mono
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-text uppercase transition-colors hover:bg-surface-2',
        className,
      )}
    >
      {target}
    </Link>
  )
}
