'use client'

import { useEffect } from 'react'

import { usePathname } from '@/i18n/navigation'

// Reveal sekali jalan (DESIGN.md 2.4): hanya elemen .reveal yang berada di bawah layar saat halaman
// dibuka yang disembunyikan, lalu tampil (fade + geser 12 px, 400 ms) saat masuk layar dan tidak
// diulang. Tanpa JavaScript atau dengan reduced-motion semua konten langsung terlihat, dan tidak
// ada elemen yang tertahan setengah transparan (kontras tetap penuh).
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          el.dataset.reveal = 'shown'
          io.unobserve(el)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    const vh = window.innerHeight
    for (const el of document.querySelectorAll<HTMLElement>('.reveal:not([data-reveal])')) {
      if (el.getBoundingClientRect().top < vh) continue
      el.dataset.reveal = 'pending'
      io.observe(el)
    }
    return () => io.disconnect()
  }, [pathname])

  return null
}
