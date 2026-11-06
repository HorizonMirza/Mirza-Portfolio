'use client'

import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from '@/lib/view-transition'

// Latar kartu pembuka (pilihan pemilik 2026-11-06 dari 50 demo: A42 "Gelombang commit"): kotak-kotak
// seperti grafik kontribusi GitHub dalam biru situs (--note mode gelap, karena kartu pembuka selalu
// gelap), lalu gelombang cahaya menyapu miring dari kiri ke kanan. Pola kotaknya hiasan, bukan data.
// Hemat: pola dasar digambar sekali ke kanvas cadangan; tiap bingkai hanya menyalin pola itu lalu
// menggambar ulang kotak di dekat gelombang. Maksimal 30 fps, hanya selama kartu terbuka (berhenti
// total saat dialog ditutup), dan rAF otomatis berhenti saat tab tersembunyi. Reduced-motion: pola diam tanpa
// gelombang. Murni hiasan, disembunyikan dari pembaca layar.

const NOTE = [77, 163, 255] as const
const LIGHT = [200, 225, 255] as const
// tingkat terang kotak seperti tingkat kontribusi GitHub (0 = kosong)
const LEVEL_ALPHA = [0.05, 0.18, 0.32, 0.5, 0.7]
const FRAME_MS = 1000 / 30
// lebar gelombang (px) dan kecepatan (lebar layar per detik)
const BAND = 160
const SPEED = 0.18

export function CommitWave() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = prefersReducedMotion()
    const base = document.createElement('canvas')
    const bctx = base.getContext('2d')
    if (!bctx) return
    let width = 0
    let height = 0
    let dpr = 1
    let size = 18
    let gap = 4
    let cols = 0
    let rows = 0
    let levels: Uint8Array = new Uint8Array(0)
    let frame = 0
    let last = 0
    const start = performance.now()

    function cell(c: CanvasRenderingContext2D, i: number, j: number, boost: number) {
      const alpha = Math.min(0.95, LEVEL_ALPHA[levels[j * cols + i]] + boost * 0.55)
      const r = Math.round(NOTE[0] + (LIGHT[0] - NOTE[0]) * boost)
      const g = Math.round(NOTE[1] + (LIGHT[1] - NOTE[1]) * boost)
      c.fillStyle = `rgb(${r} ${g} 255 / ${alpha})`
      c.beginPath()
      c.roundRect(i * (size + gap), j * (size + gap), size, size, 3)
      c.fill()
    }

    function layout() {
      const rect = canvas!.getBoundingClientRect()
      if (!rect.width) return
      dpr = Math.min(1.5, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      // HP: kotak sedikit lebih kecil agar polanya tetap rapat
      size = width < 640 ? 14 : 18
      gap = width < 640 ? 3 : 4
      cols = Math.ceil(width / (size + gap))
      rows = Math.ceil(height / (size + gap))
      levels = Uint8Array.from({ length: cols * rows }, () =>
        Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * 4),
      )
      for (const c of [canvas!, base]) {
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      bctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      bctx!.clearRect(0, 0, width, height)
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) cell(bctx!, i, j, 0)
      draw(performance.now())
    }

    function draw(now: number) {
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      ctx!.drawImage(base, 0, 0)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (still) return
      const t = (now - start) / 1000
      const front = ((t * SPEED) % 1.4) * width - 0.2 * width
      for (let j = 0; j < rows; j++) {
        const y = j * (size + gap)
        // hanya kolom di dalam pita gelombang yang digambar ulang
        const from = Math.max(0, Math.floor((front - y * 0.5 - BAND) / (size + gap)))
        const to = Math.min(cols - 1, Math.ceil((front - y * 0.5 + BAND) / (size + gap)))
        for (let i = from; i <= to; i++) {
          const boost = Math.max(0, 1 - Math.abs(i * (size + gap) + y * 0.5 - front) / BAND)
          if (boost > 0) cell(ctx!, i, j, boost)
        }
      }
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop)
      if (now - last < FRAME_MS) return
      last = now
      draw(now)
    }

    // Dialog dibuka oleh efek IntroNotice yang berjalan setelah efek ini, jadi dicek pada bingkai
    // berikutnya. Pengunjung yang sudah melihat kartu: dialog tetap tertutup, kanvas tidak bekerja.
    const dialog = canvas.closest('dialog')
    const observer = new ResizeObserver(layout)
    const stop = () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
    frame = requestAnimationFrame(() => {
      if (!dialog?.open) return
      layout()
      observer.observe(canvas)
      if (!still) frame = requestAnimationFrame(loop)
    })
    dialog?.addEventListener('close', stop)
    return () => {
      stop()
      dialog?.removeEventListener('close', stop)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="intro-wave" />
}
