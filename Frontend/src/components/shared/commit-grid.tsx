'use client'

import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from '@/lib/view-transition'

// Latar kartu pembuka dan halaman login Super Admin: kotak-kotak seperti grafik kontribusi GitHub dalam
// biru situs (--note mode gelap, karena keduanya selalu gelap), dengan gelombang cahaya yang menyapu
// miring dari kiri ke kanan. Pilihan pemilik 2026-11-06 (demo A42 "Gelombang commit"); gelombang
// sempat dihapus lalu diminta kembali dengan akhir sapuan yang lebih halus. Pola kotak hiasan acak,
// bukan data kontribusi.
// Halus: gelombang baru diulang setelah benar-benar keluar dari layar (dulu diulang saat ekornya masih
// terlihat di baris bawah sehingga tampak terpotong), ada jeda singkat antarsapuan, dan tepi cahaya
// memudar dengan kurva smoothstep, bukan garis lurus.
// Hemat: pola dasar digambar sekali ke kanvas cadangan; tiap bingkai hanya menyalin pola itu lalu
// menggambar ulang kotak di pita gelombang. Di dalam dialog (kartu pembuka) hanya bekerja selama
// dialog terbuka dan berhenti total saat ditutup; rAF berhenti sendiri saat tab tersembunyi.
// Reduced-motion: pola diam tanpa gelombang. Murni hiasan (aria-hidden).

const NOTE = [77, 163, 255] as const
const LIGHT = [200, 225, 255] as const
// tingkat terang kotak seperti tingkat kontribusi GitHub (0 = kosong)
const LEVEL_ALPHA = [0.05, 0.18, 0.32, 0.5, 0.7]
// setengah lebar pita cahaya (px), kecepatan (lebar layar per detik), jeda antarsapuan (detik)
const BAND = 170
const SPEED = 0.18
const PAUSE = 1.2
// kemiringan gelombang: tiap baris ke bawah bergeser setengah jaraknya ke kanan
const SLANT = 0.5

const smooth = (t: number) => t * t * (3 - 2 * t)

export function CommitGrid({ className = 'intro-wave' }: { className?: string }) {
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
      const nextCols = Math.ceil(width / (size + gap))
      const nextRows = Math.ceil(height / (size + gap))
      // pola acak dibuat sekali; dibuat ulang hanya bila jumlah kotak berubah
      if (nextCols !== cols || nextRows !== rows) {
        cols = nextCols
        rows = nextRows
        levels = Uint8Array.from({ length: cols * rows }, () =>
          Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * 4),
        )
      }
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
      if (still || !width) return
      // satu sapuan: dari sebelum tepi kiri sampai ekornya lewat sudut kanan bawah, lalu jeda
      const travel = width + height * SLANT + BAND * 2
      const sweep = travel / (SPEED * width)
      const t = ((now - start) / 1000) % (sweep + PAUSE)
      if (t > sweep) return
      const front = -BAND + t * SPEED * width
      for (let j = 0; j < rows; j++) {
        const y = j * (size + gap)
        // hanya kolom di dalam pita gelombang yang digambar ulang
        const from = Math.max(0, Math.floor((front - y * SLANT - BAND) / (size + gap)))
        const to = Math.min(cols - 1, Math.ceil((front - y * SLANT + BAND) / (size + gap)))
        for (let i = from; i <= to; i++) {
          const d = Math.abs(i * (size + gap) + y * SLANT - front) / BAND
          if (d < 1) cell(ctx!, i, j, smooth(1 - d))
        }
      }
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop)
      draw(now)
    }

    // Di dalam dialog (kartu pembuka): dialog dibuka oleh efek IntroNotice yang berjalan setelah efek
    // ini, jadi dicek pada bingkai berikutnya; pengunjung yang sudah melihat kartu tidak memicu apa pun.
    // Di luar dialog (halaman login) langsung berjalan.
    const dialog = canvas.closest('dialog')
    const observer = new ResizeObserver(layout)
    const stop = () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
    frame = requestAnimationFrame(() => {
      if (dialog && !dialog.open) return
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

  return <canvas ref={ref} aria-hidden="true" className={className} />
}
