'use client'

import { type ReactNode, useEffect, useRef } from 'react'

// Timeline "fokus aktif" (pilihan pemilik 2026-10-03, demo nomor 9): entri yang paling dekat dengan
// tengah layar diberi data-active, entri lain meredup (gaya di globals.css .xp-tl). Isi daftar tetap
// dirender server; tanpa JavaScript semua entri tampil penuh karena data-focus tidak dipasang.
export function FocusTimeline({ label, children }: { label: string; children: ReactNode }) {
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const ol = list.current
    if (!ol) return
    let frame = 0
    function update() {
      frame = 0
      const mid = window.innerHeight * 0.5
      // di dasar halaman entri terakhir tidak bisa mencapai tengah layar: pilih entri terakhir
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
      let best: HTMLElement | null = null
      let bestDistance = Infinity
      for (const li of ol!.querySelectorAll<HTMLElement>(':scope > li')) {
        if (atBottom) {
          best = li
          continue
        }
        const box = li.getBoundingClientRect()
        const distance = Math.abs(box.top + Math.min(box.height, 240) / 2 - mid)
        if (distance < bestDistance) {
          bestDistance = distance
          best = li
        }
      }
      for (const li of ol!.querySelectorAll<HTMLElement>(':scope > li')) {
        if (li === best) li.dataset.active = ''
        else delete li.dataset.active
      }
      // posisi tengah logo entri aktif, untuk cahaya di garis (globals.css .xp-tl::after)
      const node = best?.querySelector<HTMLElement>('.xp-node')
      if (node) {
        const top = ol!.getBoundingClientRect().top
        const box = node.getBoundingClientRect()
        ol!.style.setProperty('--xp-fill', `${box.top + box.height / 2 - top}px`)
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    ol.dataset.focus = ''
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      delete ol.dataset.focus
    }
  }, [])

  return (
    <ol ref={list} aria-label={label} className="xp-tl">
      {children}
    </ol>
  )
}
