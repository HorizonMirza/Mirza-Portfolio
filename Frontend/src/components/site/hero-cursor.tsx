'use client'

import { useEffect, useRef } from 'react'

// Kursor khusus di foto beranda (pilihan pemilik 2026-11-06 dari 20 demo: K3 "Titik + cincin"),
// menggantikan crosshair bawaan. Titik kecil langsung di posisi kursor, cincin tipis menyusul sedikit
// tertinggal; saat ditekan keduanya mengecil dan cincin terisi tipis. Hanya untuk mouse/touchpad
// (hover + pointer halus); layar sentuh tetap tanpa kursor. Di atas header, tautan, tombol, atau
// kolom isian kursor khusus disembunyikan dan kursor biasa kembali; saat digulir juga disembunyikan
// sampai kursor bergerak lagi. Posisi ditulis langsung ke transform (bukan variabel CSS).
// Reduced-motion: cincin langsung ikut tanpa tertinggal. Murni hiasan (aria-hidden).

// seberapa cepat cincin menyusul titik per bingkai (0–1)
const RING_LAG = 0.2
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], header'

export function HeroCursor() {
  const wrap = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = wrap.current
    const dotEl = dot.current
    const ringEl = ring.current
    const host = box?.closest<HTMLElement>('.hero-mask')
    if (!box || !dotEl || !ringEl || !host) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    host.dataset.cursor = ''

    let x = 0
    let y = 0
    let rx = 0
    let ry = 0
    let frame = 0
    let shown = false

    const show = (on: boolean) => {
      if (on === shown) return
      shown = on
      box.toggleAttribute('data-on', on)
    }
    const placeRing = () => {
      ringEl.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
    }
    const tick = () => {
      frame = 0
      rx += (x - rx) * RING_LAG
      ry += (y - ry) * RING_LAG
      placeRing()
      if (Math.abs(x - rx) + Math.abs(y - ry) > 0.3) frame = requestAnimationFrame(tick)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const target = event.target instanceof Element ? event.target : null
      const inside = Boolean(target && host.contains(target) && !target.closest(INTERACTIVE))
      if (!inside) {
        show(false)
        return
      }
      x = event.clientX
      y = event.clientY
      dotEl.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (!shown || reduce) {
        // baru masuk (atau tanpa animasi): cincin langsung di tempat, tidak terbang dari posisi lama
        rx = x
        ry = y
        placeRing()
      } else if (!frame) frame = requestAnimationFrame(tick)
      show(true)
    }
    const onDown = () => box.toggleAttribute('data-pressed', true)
    const onUp = () => box.toggleAttribute('data-pressed', false)
    const hide = () => show(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', hide, { passive: true })
    document.documentElement.addEventListener('pointerleave', hide)
    return () => {
      cancelAnimationFrame(frame)
      delete host.dataset.cursor
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', hide)
      document.documentElement.removeEventListener('pointerleave', hide)
    }
  }, [])

  return (
    <div ref={wrap} aria-hidden="true" className="hero-cursor">
      <div ref={ring} className="hero-cursor-ring" />
      <div ref={dot} className="hero-cursor-dot" />
    </div>
  )
}
