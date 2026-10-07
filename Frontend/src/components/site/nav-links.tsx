'use client'

import { BriefcaseBusiness, Code, House, Mail, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ViewTransition } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { scrollToTop } from '@/lib/scroll'
import { playNavSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

import { isSiteNavActive, siteNav } from './nav-items'

// ikon menu bawah HP (pilihan pemilik 2026-10-01)
const icons = {
  home: House,
  about: User,
  experience: BriefcaseBusiness,
  projects: Code,
  contact: Mail,
} as const

// Lampu hitam/putih (ikut warna teks tema) di atas menu aktif.
function LampGlow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -top-[5px] left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-text',
        className,
      )}
    >
      <span className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-text/20 blur-md" />
      <span className="absolute -top-1 h-6 w-8 rounded-full bg-text/20 blur-md" />
      <span className="absolute top-0 left-2 size-4 rounded-full bg-text/20 blur-sm" />
    </span>
  )
}

// Kapsul atas (desktop): saat pindah halaman, React <ViewTransition> dengan nama yang sama menggeser
// lampu dari menu lama ke menu baru (View Transitions bawaan browser, tanpa library).
function TopLamp() {
  return (
    <ViewTransition name="nav-lamp-top" share="auto" default="none">
      <LampGlow />
    </ViewTransition>
  )
}

// Bilah bawah HP: lima kolom sama lebar, jadi lampu cukup satu elemen yang digeser per kolom lewat
// transform (dikerjakan GPU). Di HP View Transitions dimatikan untuk pindah halaman
// (page-transitions.tsx), sehingga lampu tidak bisa memakai cara kapsul atas.
// Lebar satu kolom = (lebar daftar - 4 celah) / 5; geser = indeks x (kolom + celah).
function BottomLamp({ index }: { index: number }) {
  if (index < 0) return null
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 w-[calc((100%-4*var(--nav-gap))/5)] transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      style={{ transform: `translateX(calc(${index} * (100% + var(--nav-gap))))` }}
    >
      <LampGlow />
    </span>
  )
}

// top: teks di kapsul atas (desktop). bottom: bilah bawah HP berisi ikon besar saja, seperti bilah
// tab aplikasi (revisi pemilik 2026-10-07); nama menu tetap ada untuk pembaca layar.
export function NavLinks({ variant }: { variant: 'top' | 'bottom' }) {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  // arah geser halaman mengikuti urutan menu: ke kanan = maju, ke kiri = mundur (globals.css .nav-*)
  const currentIndex = siteNav.findIndex((item) => isSiteNavActive(pathname, item.href))
  return (
    <ul
      className={cn(
        variant === 'top'
          ? 'flex items-center gap-1'
          : 'relative grid w-full grid-cols-5 gap-(--nav-gap) [--nav-gap:0.25rem]',
      )}
    >
      {variant === 'bottom' ? <BottomLamp index={currentIndex} /> : null}
      {siteNav.map((item, index) => {
        const active = isSiteNavActive(pathname, item.href)
        // halaman menu itu sendiri (bukan halaman turunan seperti detail project)
        const here = pathname === item.href
        const Icon = icons[item.key]
        return (
          <li key={item.href} className={variant === 'bottom' ? 'min-w-0' : undefined}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              transitionTypes={[index < currentIndex ? 'nav-back' : 'nav-forward']}
              // di halaman menu itu sendiri: tidak pindah halaman, cukup gulir ke bagian atas
              onClick={(event) => {
                playNavSound()
                if (!here) return
                event.preventDefault()
                scrollToTop()
              }}
              className={cn(
                'relative inline-flex items-center justify-center rounded-full text-sm font-semibold text-muted transition-colors hover:text-text',
                variant === 'top' ? 'min-h-10 px-4' : 'h-[3.75rem] w-full',
                active && 'bg-surface-2 text-text',
              )}
            >
              {variant === 'top' ? (
                t(item.key)
              ) : (
                <>
                  <Icon className="size-7" strokeWidth={2} aria-hidden="true" />
                  <span className="sr-only">{t(item.key)}</span>
                </>
              )}
              {active && variant === 'top' ? <TopLamp /> : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
