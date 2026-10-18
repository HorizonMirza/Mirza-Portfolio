'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

// ukuran lapisan kedua yang dibuat dari foto (cukup untuk potret ±500 px, ringan diolah per piksel)
const BACK_WIDTH = 640
// jejak gumpalan: umur (detik), jari-jari relatif sisi pendek potret, jumlah maksimum
const BLOB_LIFE = 1.1
const BLOB_LIFE_REDUCED = 0.25
const BLOB_RADIUS = 0.17
const MAX_BLOBS = 60

type Blob = { x: number; y: number; r: number; life: number; seed: number }

// Lapisan kedua sementara (sebelum ada foto kedua dari pemilik): foto yang sama dalam gaya cetak biru,
// abu-abu kontras tinggi diwarnai biru situs dengan kisi tipis. Diolah per piksel (getImageData) agar
// juga jalan di Safari yang belum mendukung ctx.filter.
function blueprint(img: HTMLImageElement) {
  const ratio = img.naturalHeight / img.naturalWidth
  const c = document.createElement('canvas')
  c.width = BACK_WIDTH
  c.height = Math.round(BACK_WIDTH * ratio)
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.drawImage(img, 0, 0, c.width, c.height)
  const data = g.getImageData(0, 0, c.width, c.height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    const lum = (0.2126 * px[i]! + 0.7152 * px[i + 1]! + 0.0722 * px[i + 2]!) / 255
    const v = Math.min(1, Math.max(0, (lum - 0.5) * 1.7 + 0.55))
    // gelap = biru tua, terang = biru muda
    px[i] = 12 + v * 150
    px[i + 1] = 30 + v * 175
    px[i + 2] = 80 + v * 175
  }
  g.putImageData(data, 0, 0)
  g.strokeStyle = 'rgb(190 215 255 / 0.16)'
  g.lineWidth = 1
  for (let x = 0; x < c.width; x += 20) {
    g.beginPath()
    g.moveTo(x + 0.5, 0)
    g.lineTo(x + 0.5, c.height)
    g.stroke()
  }
  for (let y = 0; y < c.height; y += 20) {
    g.beginPath()
    g.moveTo(0, y + 0.5)
    g.lineTo(c.width, y + 0.5)
    g.stroke()
  }
  return c
}

// Potret hero dengan efek "liquid mask" (permintaan pemilik 2026-10-18, terinspirasi komponen
// HoverMaskReveal): kursor atau jari meninggalkan jejak gumpalan lembut yang membuka lapisan kedua di
// bawah foto, lalu menyusut dan menutup lagi. Dibuat sendiri dengan canvas 2D, tanpa WebGL/three.js.
// Foto tetap <img> biasa (children) sehingga tampil tanpa JavaScript; canvas hanya dekorasi.
export function LiquidMaskPortrait({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = root?.querySelector('img')
    if (!root || !canvas || !ctx || !img) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mask = document.createElement('canvas')
    const mctx = mask.getContext('2d')
    if (!mctx) return
    let back: HTMLCanvasElement | null = null
    let blobs: Blob[] = []
    let pointer: { x: number; y: number } | null = null
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let last = 0
    let disposed = false

    const prepare = () => {
      if (disposed || back) return
      try {
        back = blueprint(img)
      } catch {
        // foto lintas origin tanpa CORS: efek dilewati, foto tetap tampil
        back = null
      }
    }
    if (img.complete && img.naturalWidth) prepare()
    else img.addEventListener('load', prepare, { once: true })

    const resize = () => {
      const rect = root.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      for (const c of [canvas, mask]) {
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
      }
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)

    const add = (x: number, y: number, strength = 1) => {
      blobs.push({
        x,
        y,
        r: Math.min(width, height) * BLOB_RADIUS * strength,
        life: 1,
        seed: Math.random() * Math.PI * 2,
      })
      if (blobs.length > MAX_BLOBS) blobs.shift()
    }

    const draw = (time: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!back || blobs.length === 0) return
      mctx.setTransform(1, 0, 0, 1, 0, 0)
      mctx.clearRect(0, 0, mask.width, mask.height)
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (const b of blobs) {
        const k = Math.sqrt(b.life)
        const wobble = reduce.matches ? 1 : 1 + Math.sin(time / 260 + b.seed) * 0.08
        const r = b.r * k * wobble
        // tepi lembut: gradien radial menggantikan blur (yang belum ada di canvas Safari)
        const gradient = mctx.createRadialGradient(b.x, b.y, r * 0.35, b.x, b.y, r)
        gradient.addColorStop(0, 'rgb(0 0 0 / 1)')
        gradient.addColorStop(1, 'rgb(0 0 0 / 0)')
        mctx.fillStyle = gradient
        mctx.beginPath()
        mctx.ellipse(b.x, b.y, r, r / wobble, b.seed, 0, Math.PI * 2)
        mctx.fill()
      }
      // lapisan kedua mengikuti object-fit: cover, lalu dipotong dengan masker
      const scale = Math.max(canvas.width / back.width, canvas.height / back.height)
      const w = back.width * scale
      const h = back.height * scale
      ctx.drawImage(back, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(mask, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = (time: number) => {
      frame = 0
      const dt = Math.min(0.05, (time - last) / 1000)
      last = time
      const life = reduce.matches ? BLOB_LIFE_REDUCED : BLOB_LIFE
      for (const b of blobs) b.life -= dt / life
      blobs = blobs.filter((b) => b.life > 0)
      draw(time)
      if (blobs.length > 0 || pointer) frame = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(loop)
    }

    const local = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMove = (e: PointerEvent) => {
      const p = local(e)
      if (pointer) {
        // isi jarak antar-kejadian agar jejak tidak putus saat kursor cepat
        const distance = Math.hypot(p.x - pointer.x, p.y - pointer.y)
        const steps = Math.min(6, Math.floor(distance / 14))
        for (let i = 1; i <= steps; i++) {
          add(
            pointer.x + ((p.x - pointer.x) * i) / steps,
            pointer.y + ((p.y - pointer.y) * i) / steps,
            0.9,
          )
        }
      }
      add(p.x, p.y)
      pointer = p
      wake()
    }
    const onLeave = () => {
      pointer = null
    }
    const onDown = (e: PointerEvent) => {
      const p = local(e)
      add(p.x, p.y, 1.3)
      wake()
    }
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    root.addEventListener('pointerdown', onDown)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      img.removeEventListener('load', prepare)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <div ref={rootRef} className={cn('hero-mask', className)}>
      {children}
      <canvas ref={canvasRef} aria-hidden="true" className="hero-mask-canvas" />
    </div>
  )
}
