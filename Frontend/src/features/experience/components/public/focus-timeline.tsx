'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { playTimelineStepSound } from '@/lib/ui-sounds'

// Timeline "fokus aktif" (pilihan pemilik 2026-10-03, demo nomor 9): entri yang sedang dibaca
// (lihat "garis baca" di update()) diberi data-active, entri lain meredup (gaya di globals.css
// .xp-tl). Isi daftar tetap dirender server; tanpa JavaScript semua entri tampil penuh karena
// data-focus tidak dipasang.
// Saat entri aktif berganti karena digulir, berbunyi bip pendek (lib/ui-sounds.ts). Browser baru
// mengizinkan suara setelah pengunjung menekan/menyentuh halaman, jadi gulir pertama bisa sunyi.
export function FocusTimeline({ label, children }: { label: string; children: ReactNode }) {
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const ol = list.current
    if (!ol) return
    let frame = 0
    let current: HTMLElement | null = null
    function update(fromScroll = false) {
      frame = 0
      const mid = window.innerHeight * 0.5
      // di dasar halaman entri terakhir tidak bisa mencapai tengah layar: pilih entri terakhir
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
      // "Garis baca" di tengah layar: entri aktif adalah entri terakhir yang bagian atasnya sudah
      // melewati garis itu; bila belum ada, entri pertama. Jadi saat halaman dibuka yang aktif
      // selalu entri teratas (revisi pemilik 2026-10-18: sebelumnya entri kedua yang lebih dekat
      // ke tengah layar langsung menyala).
      const items = ol!.querySelectorAll<HTMLElement>(':scope > li')
      let best: HTMLElement | null = items[0] ?? null
      for (const li of items) {
        if (atBottom) {
          best = li
          continue
        }
        if (li.getBoundingClientRect().top <= mid) best = li
      }
      for (const li of ol!.querySelectorAll<HTMLElement>(':scope > li')) {
        if (li === best) li.dataset.active = ''
        else delete li.dataset.active
      }
      if (fromScroll && best && current && best !== current) playTimelineStepSound()
      current = best
      // posisi tengah logo entri aktif, untuk cahaya di garis (globals.css .xp-tl::after)
      const node = best?.querySelector<HTMLElement>('.xp-node')
      if (node) {
        const top = ol!.getBoundingClientRect().top
        const box = node.getBoundingClientRect()
        ol!.style.setProperty('--xp-fill', `${box.top + box.height / 2 - top}px`)
      }
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
    <ol ref={list} aria-label={label} className="xp-tl">
      {children}
    </ol>
  )
}
