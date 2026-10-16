'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { playExperienceToggleSound } from '@/lib/ui-sounds'

const DURATION_MS = 350
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Pembungkus akordion Pengalaman di beranda: isinya tetap dirender server (<details> bawaan
// browser), komponen ini menambah dua hal:
// - suara saat satu baris dibuka atau ditutup (pilihan pemilik 2026-10-16, demo S9);
// - animasi tinggi saat membuka dan menutup di semua browser, termasuk Safari HP yang belum
//   mendukung ::details-content (revisi pemilik 2026-10-16: di HP detail langsung muncul).
// Tanpa JavaScript atau dengan reduced-motion, <details> tetap membuka dan menutup seketika.
export function ExperienceAccordion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const running = new WeakMap<HTMLDetailsElement, Animation>()

    function animateHeight(
      details: HTMLDetailsElement,
      from: number,
      to: number,
      done?: () => void,
    ) {
      running.get(details)?.cancel()
      details.style.overflow = 'hidden'
      const animation = details.animate(
        { height: [`${from}px`, `${to}px`] },
        { duration: DURATION_MS, easing: EASING },
      )
      running.set(details, animation)
      const cleanup = () => {
        details.style.overflow = ''
        running.delete(details)
      }
      animation.onfinish = () => {
        done?.()
        cleanup()
      }
      animation.oncancel = cleanup
    }

    // Klik pada <summary> (juga Enter/Spasi dari keyboard): buka/tutup dikendalikan di sini agar
    // tingginya bisa dianimasikan. Suara tutup diputar saat klik, tidak menunggu animasi selesai.
    const onClick = (event: MouseEvent) => {
      const summary = (event.target as Element | null)?.closest('summary')
      const details = summary?.parentElement
      if (!summary || !(details instanceof HTMLDetailsElement) || !root.contains(details)) return
      if (reducedMotion()) return
      event.preventDefault()
      const from = details.getBoundingClientRect().height
      if (details.open && details.dataset.closing === undefined) {
        details.dataset.closing = ''
        // "toggle" saat open=false di akhir animasi tidak perlu berbunyi lagi
        details.dataset.silent = ''
        playExperienceToggleSound(false)
        animateHeight(details, from, summary.getBoundingClientRect().height, () => {
          details.open = false
          delete details.dataset.closing
        })
        return
      }
      // membuka, atau membatalkan penutupan yang sedang berjalan
      if (details.open) {
        delete details.dataset.closing
        delete details.dataset.silent
        playExperienceToggleSound(true)
      } else {
        details.open = true
      }
      animateHeight(details, from, details.scrollHeight)
    }

    // Suara untuk buka/tutup yang tidak lewat animasi (reduced-motion, atau dibuka dari kode).
    const onToggle = (event: Event) => {
      const details = event.target
      if (!(details instanceof HTMLDetailsElement)) return
      if (details.dataset.silent !== undefined) {
        delete details.dataset.silent
        return
      }
      playExperienceToggleSound(details.open)
    }

    root.addEventListener('click', onClick)
    // event "toggle" tidak naik ke induk, jadi didengar pada fase capture
    root.addEventListener('toggle', onToggle, true)
    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('toggle', onToggle, true)
    }
  }, [])

  return (
    <div ref={ref} className="home-xp-list">
      {children}
    </div>
  )
}
