'use client'

import { useEffect, useRef } from 'react'

// Latar kartu pembuka dan halaman login Super Admin (sejak 2026-11-06): kotak-kotak seperti grafik kontribusi GitHub dalam biru situs (--note mode
// gelap, karena kartu pembuka dan login selalu gelap). Pilihan pemilik 2026-11-06 dari 50 demo (A42
// "Gelombang commit"), lalu gelombang cahaya yang menyapu kotak dihapus atas permintaan pemilik di
// hari yang sama: polanya kini diam. Pola kotak hiasan acak, bukan data kontribusi.
// Diam, jadi tanpa loop animasi: digambar sekali saat dialog terbuka dan diulang hanya bila ukuran
// layar berubah. Murni hiasan, disembunyikan dari pembaca layar.

const NOTE = '77 163 255'
// tingkat terang kotak seperti tingkat kontribusi GitHub (0 = kosong)
const LEVEL_ALPHA = [0.05, 0.18, 0.32, 0.5, 0.7]

export function CommitGrid({ className = 'intro-wave' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let levels: Uint8Array = new Uint8Array(0)
    let cols = 0

    function draw() {
      const rect = canvas!.getBoundingClientRect()
      if (!rect.width) return
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      // HP: kotak sedikit lebih kecil agar polanya tetap rapat
      const size = rect.width < 640 ? 14 : 18
      const gap = rect.width < 640 ? 3 : 4
      const nextCols = Math.ceil(rect.width / (size + gap))
      const rows = Math.ceil(rect.height / (size + gap))
      // pola acak dibuat sekali; saat ukuran berubah hanya ditambah, agar kotak lama tidak berganti
      if (nextCols !== cols || levels.length < nextCols * rows) {
        cols = nextCols
        levels = Uint8Array.from({ length: cols * rows }, () =>
          Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * 4),
        )
      }
      canvas!.width = Math.round(rect.width * dpr)
      canvas!.height = Math.round(rect.height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          ctx!.fillStyle = `rgb(${NOTE} / ${LEVEL_ALPHA[levels[j * cols + i]]})`
          ctx!.beginPath()
          ctx!.roundRect(i * (size + gap), j * (size + gap), size, size, 3)
          ctx!.fill()
        }
      }
    }

    // Di dalam dialog (kartu pembuka): dialog dibuka oleh efek IntroNotice yang berjalan setelah efek
    // ini, jadi dicek pada bingkai berikutnya; pengunjung yang sudah melihat kartu tidak memicu gambar.
    // Di luar dialog (halaman login) langsung digambar.
    const dialog = canvas.closest('dialog')
    const observer = new ResizeObserver(draw)
    const stop = () => observer.disconnect()
    const frame = requestAnimationFrame(() => {
      if (dialog && !dialog.open) return
      draw()
      observer.observe(canvas)
    })
    dialog?.addEventListener('close', stop)
    return () => {
      cancelAnimationFrame(frame)
      stop()
      dialog?.removeEventListener('close', stop)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className={className} />
}
