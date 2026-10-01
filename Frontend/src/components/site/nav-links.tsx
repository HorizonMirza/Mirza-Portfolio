'use client'

import { Briefcase, House, LayoutGrid, Mail, User, Wrench } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ViewTransition } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { playNavSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

import { isSiteNavActive, siteNav } from './nav-items'

const icons = {
  home: House,
  about: User,
  experience: Briefcase,
  skills: Wrench,
  projects: LayoutGrid,
  contact: Mail,
} as const

// Lampu hitam/putih (ikut warna teks tema) di atas menu aktif. Saat pindah halaman, React <ViewTransition> dengan nama yang sama
// menggeser lampu dari menu lama ke menu baru (View Transitions bawaan browser, tanpa library).
// Nama dibedakan per varian agar tidak ada dua elemen dengan nama yang sama di satu halaman.
function Lamp({ variant }: { variant: 'top' | 'bottom' }) {
  return (
    <ViewTransition name={`nav-lamp-${variant}`} share="auto" default="none">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-[5px] left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-text"
      >
        <span className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-text/20 blur-md" />
        <span className="absolute -top-1 h-6 w-8 rounded-full bg-text/20 blur-md" />
        <span className="absolute top-0 left-2 size-4 rounded-full bg-text/20 blur-sm" />
      </span>
    </ViewTransition>
  )
}

// top: teks di kapsul atas (desktop). bottom: ikon di kapsul bawah (HP), label untuk pembaca layar.
export function NavLinks({ variant }: { variant: 'top' | 'bottom' }) {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  return (
    <ul className={cn('flex items-center', variant === 'top' ? 'gap-1' : 'gap-0.5')}>
      {siteNav.map((item) => {
        const active = isSiteNavActive(pathname, item.href)
        const Icon = icons[item.key]
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              // menu yang sedang aktif tidak berpindah halaman, jadi tidak berbunyi
              onClick={active ? undefined : playNavSound}
              title={variant === 'bottom' ? t(item.key) : undefined}
              className={cn(
                'relative inline-flex items-center justify-center rounded-full text-sm font-semibold text-muted transition-colors hover:text-text',
                variant === 'top' ? 'min-h-10 px-4' : 'size-11',
                active && 'bg-surface-2 text-text',
              )}
            >
              {variant === 'top' ? (
                t(item.key)
              ) : (
                <>
                  <Icon className="size-[18px]" strokeWidth={2.25} aria-hidden="true" />
                  <span className="sr-only">{t(item.key)}</span>
                </>
              )}
              {active ? <Lamp variant={variant} /> : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
