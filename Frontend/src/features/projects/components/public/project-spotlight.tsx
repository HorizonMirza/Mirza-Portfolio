'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'

import { rememberListPosition, takeReturnPosition } from '@/features/projects/list-return'
import { playProjectSpotlightSound } from '@/lib/ui-sounds'

// Daftar project "lampu sorot" (pilihan pemilik 2026-10-09, demo efek gulir nomor 7, tanpa cahaya
// biru): baris yang paling dekat dengan tengah layar diberi data-active dan tampil penuh, baris lain
// hampir gelap dan sedikit mengecil (globals.css .pj-spot). Logika sama dengan timeline Experience.
// Saat baris aktif berganti karena digulir, berbunyi "blup" gelembung (pilihan pemilik 2026-10-09,
// demo suara A7, lib/ui-sounds.ts); browser baru mengizinkan suara setelah pengunjung menekan atau
// menyentuh halaman. Isi daftar tetap dirender server, sudah dengan keadaan awal (baris pertama
// menyala, sisanya redup) agar baris di bawah tidak sempat menyala saat halaman dibuka (revisi
// pemilik 2026-10-10); tanpa JavaScript semua baris tampil penuh (globals.css @media scripting).
export function ProjectSpotlight({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const list = useRef<HTMLOListElement>(null)

  // Kembali dari detail lewat "Semua project": langsung ke posisi terakhir sebelum project ditekan
  // (revisi pemilik 2026-10-09). Dikerjakan sebelum layar digambar agar tidak terlihat melompat
  // dan gambar terbang (View Transition) mendarat di barisnya.
  useLayoutEffect(() => {
    const y = takeReturnPosition()
    if (y !== null) window.scrollTo({ top: y, behavior: 'instant' })
  }, [])

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
    // simpan posisi gulir saat project ditekan (tautan gambar atau judul)
    const remember = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
      const slug = link?.pathname.split('/').pop()
      if (slug) rememberListPosition(slug, window.scrollY)
    }
    update()
    // transisi baru dinyalakan setelah koreksi pertama digambar, jadi keadaan awal tidak beranimasi
    const ready = requestAnimationFrame(() => {
      ol.dataset.focus = 'on'
    })
    ol.addEventListener('click', remember)
    window.addEventListener('scroll', scheduleScroll, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      cancelAnimationFrame(ready)
      window.removeEventListener('scroll', scheduleScroll)
      window.removeEventListener('resize', schedule)
      ol.removeEventListener('click', remember)
      ol.dataset.focus = 'pending'
    }
  }, [])

  return (
    <ol ref={list} data-focus="pending" className={className ? `pj-spot ${className}` : 'pj-spot'}>
      {Children.map(children, (child, index) =>
        index === 0 && isValidElement(child)
          ? cloneElement(child as ReactElement<{ 'data-active'?: string }>, { 'data-active': '' })
          : child,
      )}
    </ol>
  )
}
