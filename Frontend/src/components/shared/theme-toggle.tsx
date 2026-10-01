'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { type MouseEvent, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

import { canAnimateViewTransition, originOf, revealChange } from '@/lib/circle-reveal'
import { cn } from '@/lib/utils'

const subscribe = () => () => {}

const SUN_RAYS = [
  'M12.4058 1.76251V3.76251',
  'M12.4058 21.7625V23.7625',
  'M4.62598 4.98248L6.04598 6.40248',
  'M18.7656 19.1225L20.1856 20.5425',
  'M1.40576 12.7625H3.40576',
  'M21.4058 12.7625H23.4058',
  'M4.62598 20.5425L6.04598 19.1225',
  'M18.7656 6.40248L20.1856 4.98248',
]

// Ikon matahari/bulan dari komponen AnimatedThemeToggle, digerakkan CSS (globals.css .theme-icon):
// garis digambar ulang (stroke-dashoffset) sambil membesar/mengecil. Keadaan dibaca dari kelas
// .dark di <html>, jadi benar sejak HTML pertama tanpa hydration mismatch.
function SolarSwitch() {
  return (
    <svg className="theme-icon size-5" viewBox="0 0 25 25" fill="none" aria-hidden="true">
      <g className="theme-sun" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path
          pathLength={1}
          d="M12.4058 17.7625C15.1672 17.7625 17.4058 15.5239 17.4058 12.7625C17.4058 10.0011 15.1672 7.76251 12.4058 7.76251C9.64434 7.76251 7.40576 10.0011 7.40576 12.7625C7.40576 15.5239 9.64434 17.7625 12.4058 17.7625Z"
        />
        {SUN_RAYS.map((d) => (
          <path key={d} pathLength={1} d={d} />
        ))}
      </g>
      <path
        className="theme-moon"
        pathLength={1}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.1918 13.2013C21.0345 14.9035 20.3957 16.5257 19.35 17.8781C18.3044 19.2305 16.8953 20.2571 15.2875 20.8379C13.6797 21.4186 11.9398 21.5294 10.2713 21.1574C8.60281 20.7854 7.07479 19.9459 5.86602 18.7371C4.65725 17.5283 3.81774 16.0003 3.4457 14.3318C3.07367 12.6633 3.18451 10.9234 3.76526 9.31561C4.346 7.70783 5.37263 6.29868 6.72501 5.25307C8.07739 4.20746 9.69959 3.56862 11.4018 3.41132C10.4052 4.75958 9.92564 6.42077 10.0503 8.09273C10.175 9.76469 10.8957 11.3364 12.0812 12.5219C13.2667 13.7075 14.8384 14.4281 16.5104 14.5528C18.1823 14.6775 19.8435 14.1979 21.1918 13.2013Z"
      />
    </svg>
  )
}

// Satu tombol bulat: menyala = mode gelap. Tema baru meluas melingkar dari tombol
// (lib/circle-reveal.ts). Tanpa dukungan browser atau dengan reduced-motion: langsung ganti.
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('Theme')
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement
    // baca dari DOM agar klik sebelum hydration selesai tetap membalik tema yang terlihat
    const next = root.classList.contains('dark') ? 'light' : 'dark'
    const apply = () => {
      root.classList.remove('light', 'dark')
      root.classList.add(next)
      root.style.colorScheme = next
      setTheme(next)
    }

    if (!canAnimateViewTransition()) {
      apply()
      return
    }
    revealChange(originOf(event.currentTarget), () => flushSync(apply))
  }

  return (
    <button
      type="button"
      aria-pressed={mounted ? resolvedTheme === 'dark' : undefined}
      title={t('darkMode')}
      onClick={toggle}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors hover:bg-surface-2',
        className,
      )}
    >
      <SolarSwitch />
      <span className="sr-only">{t('darkMode')}</span>
    </button>
  )
}
