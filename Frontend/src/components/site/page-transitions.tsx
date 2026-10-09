'use client'

import { useLocale } from 'next-intl'
import { useEffect, useLayoutEffect, useRef } from 'react'

import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { warmUpAudio } from '@/lib/ui-sounds'
import { prefersReducedMotion, touchFirstDevice } from '@/lib/view-transition'

import { isSiteNavActive, siteNav } from './nav-items'

// Perangkat sentuh (HP, tablet): pindah halaman TANPA View Transitions bawaan browser. Snapshot
// halaman lama dan baru dikerjakan sinkron dalam satu task panjang, dan di HP itu membuat transisi
// patah-patah (diukur 2026-10-07: jeda frame sampai 400 ms dengan CPU 4x lebih lambat, 33–133 ms
// tanpanya). React punya jalur bawaan bila browser tidak mendukung View Transitions: DOM langsung
// diganti. Jalur itu dipakai dengan menutupi document.startViewTransition, lalu halaman baru masuk
// lewat animasi transform + opacity yang dikerjakan GPU. Tombol tema tetap memakai fungsi aslinya
// (lib/view-transition.ts). Laptop dan desktop (pointer halus) tidak berubah.
if (typeof document !== 'undefined' && touchFirstDevice()) {
  Object.defineProperty(document, 'startViewTransition', {
    value: undefined,
    configurable: true,
    writable: true,
  })
}

const SLIDE_PX = 40

// pindah antara daftar project dan detailnya (ke dua arah)
function isProjectHop(from: string, to: string) {
  const list = /^\/projects\/?$/
  const detail = /^\/projects\/[^/]+$/
  return (list.test(from) && detail.test(to)) || (detail.test(from) && list.test(to))
}

function menuIndex(pathname: string) {
  return siteNav.findIndex((item) => isSiteNavActive(pathname, item.href))
}

export function PageTransitions() {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const previous = useRef(pathname)

  // Halaman baru masuk dari arah urutan menu (sama dengan geser di desktop), navigasi lain pudar.
  useLayoutEffect(() => {
    const from = previous.current
    previous.current = pathname
    if (from === pathname || !touchFirstDevice() || prefersReducedMotion()) return
    const main = document.getElementById('main')
    if (!main) return
    // daftar project ↔ detail: muncul lebih pelan sambil sedikit naik (revisi pemilik 2026-10-09)
    if (isProjectHop(from, pathname)) {
      main.animate(
        [
          { opacity: 0, transform: 'translate3d(0, 16px, 0)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
      return
    }
    const a = menuIndex(from)
    const b = menuIndex(pathname)
    const shift = a < 0 || b < 0 || a === b ? 0 : b > a ? SLIDE_PX : -SLIDE_PX
    main.animate(
      [
        { opacity: 0, transform: `translate3d(${shift}px, 0, 0)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )
  }, [pathname])

  // Hal yang dulu baru disiapkan saat tombol pertama kali ditekan (sehingga hanya klik pertama
  // yang tersendat) disiapkan lebih awal:
  // - mesin suara (AudioContext) dibuat pada sentuhan/klik pertama di mana pun;
  // - halaman yang sama dalam bahasa lain diambil di belakang layar saat browser senggang. Tombol
  //   bahasa tidak bisa di-prefetch oleh <Link> (next-intl mematikannya untuk ganti bahasa).
  useEffect(() => {
    const warm = () => warmUpAudio()
    const options = { capture: true, once: true, passive: true } as const
    window.addEventListener('pointerdown', warm, options)
    window.addEventListener('keydown', warm, options)
    return () => {
      window.removeEventListener('pointerdown', warm, options)
      window.removeEventListener('keydown', warm, options)
    }
  }, [])

  useEffect(() => {
    const target = routing.locales.find((l) => l !== locale)
    if (!target) return
    const run = () => router.prefetch(pathname, { locale: target })
    // Safari belum punya requestIdleCallback
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(run, 1500)
    return () => clearTimeout(id)
  }, [locale, pathname, router])

  return null
}
