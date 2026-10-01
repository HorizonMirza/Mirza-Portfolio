'use client'

import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

const subscribe = () => () => {}

// Satu tombol bulat: menyala = mode gelap. Ikon dipilih lewat CSS (kelas .dark di <html>), jadi
// tampil benar sejak HTML pertama tanpa hydration mismatch.
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('Theme')
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  return (
    <button
      type="button"
      aria-pressed={mounted ? resolvedTheme === 'dark' : undefined}
      title={t('darkMode')}
      // baca dari DOM agar klik sebelum hydration selesai tetap membalik tema yang terlihat
      onClick={() =>
        setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
      }
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors hover:bg-surface-2',
        className,
      )}
    >
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
      <span className="sr-only">{t('darkMode')}</span>
    </button>
  )
}
