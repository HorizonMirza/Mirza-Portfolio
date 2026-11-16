'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { type PageShape, PageShapeSkeleton } from '@/components/shared/page-shapes'
import { usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

// jeda sebelum skeleton tampil: halaman yang sudah diambil lebih dulu (prefetch) berganti tanpa kedip
const SHOW_DELAY_MS = 150
// pengaman bila navigasi dibatalkan atau gagal tanpa mengganti alamat
const GIVE_UP_MS = 10_000

type Shape = Extract<
  PageShape,
  'home' | 'about' | 'experience' | 'projects' | 'project' | 'contact' | 'text'
>

// path tanpa awalan bahasa: /id/projects/gaas → /projects/gaas
function stripLocale(path: string) {
  const parts = path.split('/')
  return routing.locales.includes(parts[1] as (typeof routing.locales)[number])
    ? `/${parts.slice(2).join('/')}`
    : path
}

function shapeOf(path: string): Shape {
  if (path === '/' || path === '') return 'home'
  if (path.startsWith('/about')) return 'about'
  if (path.startsWith('/experience')) return 'experience'
  if (/^\/projects\/[^/]+/.test(path)) return 'project'
  if (path.startsWith('/projects')) return 'projects'
  if (path.startsWith('/contact')) return 'contact'
  return 'text'
}

// Tautan internal yang akan berpindah halaman di dalam situs (bukan tab baru, unduhan, atau #bagian).
function internalTarget(event: MouseEvent): string | null {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return null
  const anchor = (event.target as Element | null)?.closest?.('a')
  if (!anchor || anchor.hasAttribute('download')) return null
  if (anchor.target && anchor.target !== '_self') return null
  const url = new URL(anchor.href, location.href)
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return null
  if (url.pathname === location.pathname) return null
  return url.pathname
}

// Skeleton shimmer saat pindah halaman di situs publik (pilihan pemilik 2026-11-11, DESIGN.md bagian
// 125). Halaman publik sengaja tanpa loading.tsx (bagian 111: HTML statis jadi skeleton, 404 jadi 200),
// jadi skeleton ini hanya ada di browser: muncul setelah tautan ditekan bila halaman tujuan belum siap
// dalam 150 ms, menutupi isi lama dengan bentuk halaman tujuan, lalu hilang begitu alamat berganti.
// Tanpa JavaScript dan untuk mesin pencari tidak ada yang berubah.
export function NavigationSkeleton() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Common')
  const [target, setTarget] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const next = internalTarget(event)
      if (next) setTarget(next)
    }
    const onPop = () => setTarget(location.pathname)
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  useEffect(() => {
    if (!target) return
    const show = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    const giveUp = window.setTimeout(() => {
      setTarget(null)
      setVisible(false)
    }, GIVE_UP_MS)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(giveUp)
    }
  }, [target])

  // Halaman baru sudah dipasang: skeleton hilang pada render yang sama dengan isi barunya, sebelum
  // layar digambar (penyesuaian state saat render, bukan efek).
  const here = `${locale}${pathname}`
  const [seen, setSeen] = useState(here)
  if (seen !== here) {
    setSeen(here)
    setTarget(null)
    setVisible(false)
  }

  if (!visible || !target) return null
  const shape = shapeOf(stripLocale(target))
  return (
    <div
      role="status"
      aria-busy="true"
      data-navigation-skeleton={shape}
      className="fixed inset-0 z-30 overflow-hidden bg-bg pt-[calc(env(safe-area-inset-top,0px)+5.5rem)] lg:pt-[calc(env(safe-area-inset-top,0px)+6rem)]"
    >
      <span className="sr-only">{t('loadingPage')}</span>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 sm:px-6 lg:px-8">
        {/* bentuk sama dengan panggung pratinjau admin (components/shared/page-shapes.tsx) */}
        <PageShapeSkeleton shape={shape} />
      </div>
    </div>
  )
}
