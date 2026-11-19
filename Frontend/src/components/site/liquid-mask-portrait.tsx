'use client'

// Hero dengan efek "liquid mask": kursor atau jari di mana saja di hero, termasuk di belakang
// navbar, meninggalkan jejak cair yang membuka gambar kedua (`back`, foto armor dengan bingkai dan
// pose yang sama), lalu menyusut dan menutup lagi. Gambar kedua digambar tepat di atas <img>
// pertama, jadi hanya tubuh yang berganti; latar tidak berubah. Isi (nama dan <img>) tetap HTML
// biasa sehingga tampil tanpa JavaScript; kanvas hanya dekorasi. Mesinnya di liquid-mask-engine.ts.

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { createLiquidMask } from './liquid-mask-engine'

export function LiquidMaskPortrait({
  children,
  back,
  bleed,
  className,
  disabled = false,
}: {
  children: ReactNode
  // Admin → Pengaturan "Animasi Hero" mati: hanya isi HTML, tanpa canvas dan tanpa pendengar kursor
  disabled?: boolean
  // alamat gambar kedua (satu origin dengan situs, atau Cloudinary yang mengirim header CORS)
  back: string
  // ruang tambahan gambar kedua di luar bingkai foto, sebagai bagian lebar/tinggi foto (kiri-kanan, atas),
  // mis. jambul helm yang menjulang di atas foto
  bleed: { x: number; top: number }
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // naik setiap konteks WebGL dipulihkan browser, agar efek dipasang ulang
  const [glEpoch, setGlEpoch] = useState(0)
  // true sejak konteks dipulihkan sampai efek baru terpasang: cleanup tidak boleh melepas konteks
  // yang akan dipakai lagi
  const restoringRef = useRef(false)
  const { x: bleedX, top: bleedTop } = bleed

  useEffect(() => {
    // efek baru (cleanup efek lama sudah berjalan): cleanup berikutnya kembali melepas konteks
    restoringRef.current = false
    if (disabled) return
    const root = rootRef.current
    const canvas = canvasRef.current
    const img = root?.querySelector<HTMLImageElement>('figure img')
    if (!root || !canvas || !img) return
    const mask = createLiquidMask({
      root,
      canvas,
      img,
      back,
      bleed: { x: bleedX, top: bleedTop },
      onRestored: () => {
        restoringRef.current = true
        setGlEpoch((n) => n + 1)
      },
    })
    return () => mask?.destroy(!restoringRef.current)
  }, [back, bleedX, bleedTop, glEpoch, disabled])

  return (
    <div ref={rootRef} className={cn('hero-mask', className)}>
      {children}
      {disabled ? null : <canvas ref={canvasRef} aria-hidden="true" className="hero-mask-canvas" />}
    </div>
  )
}
