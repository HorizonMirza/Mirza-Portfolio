'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { playProjectSpotlightSound } from '@/lib/ui-sounds'

// Daftar project "lampu sorot" (pilihan pemilik 2026-10-09, demo efek gulir nomor 7, tanpa cahaya
// biru): baris yang paling dekat dengan tengah layar diberi data-active dan tampil penuh, baris lain
// hampir gelap dan sedikit mengecil (globals.css .pj-spot). Logika sama dengan timeline Experience.
// Saat baris aktif berganti karena digulir, berbunyi "blup" gelembung (pilihan pemilik 2026-10-09,
// demo suara A7, lib/ui-sounds.ts); browser baru mengizinkan suara setelah pengunjung menekan atau
// menyentuh halaman. Isi daftar tetap dirender server; tanpa JavaScript semua baris tampil penuh
// karena data-focus tidak dipasang.
export function ProjectSpotlight({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const ol = list.current
    if (!ol) return
    let frame = 0
    let current: HTMLElement | null = null
    function update(fromScroll = false) {
      frame = 0
      const mid = window.innerHeight * 0.5
      // di dasar halaman baris terakhir tidak bisa mencapai tengah layar: pilih baris terakhir
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
      const rows = ol!.querySelectorAll<HTMLElement>(':scope > li')
      let best: HTMLElement | null = null
      let bestDistance = Infinity
      for (const li of rows) {
        if (atBottom) {
          best = li
          continue
        }
        const box = li.getBoundingClientRect()
        const distance = Math.abs(box.top + box.height / 2 - mid)
        if (distance < bestDistance) {
          bestDistance = distance
          best = li
        }
      }
      for (const li of rows) {
        if (li === best) li.dataset.active = ''
        else delete li.dataset.active
      }
      if (fromScroll && best && current && best !== current) playProjectSpotlightSound()
      current = best
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => update(false))
    }
    const scheduleScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => update(true))
    }
    ol.dataset.focus = ''
    update()
    window.addEventListener('scroll', scheduleScroll, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleScroll)
      window.removeEventListener('resize', schedule)
      delete ol.dataset.focus
    }
  }, [])

  return (
    <ol ref={list} className={className ? `pj-spot ${className}` : 'pj-spot'}>
      {children}
    </ol>
  )
}
