'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

// jejak gumpalan: umur (detik), jari-jari relatif sisi pendek area, jumlah maksimum
const BLOB_LIFE = 1.1
const BLOB_LIFE_REDUCED = 0.25
const BLOB_RADIUS = 0.13
const MAX_BLOBS = 70
// gambar kedua dimuat setelah halaman tenang (atau saat pertama disentuh), bukan saat halaman dibuka
const BACK_DELAY_MS = 1200

type Blob = { x: number; y: number; r: number; life: number; seed: number }

// Hero dengan efek "liquid mask" (permintaan pemilik 2026-10-18, seperti komponen HoverMaskReveal dan
// ibnuhakim.id): kursor atau jari di mana saja di hero meninggalkan jejak gumpalan lembut yang membuka
// gambar kedua (`back`, sejak 2026-10-19 foto armor dengan bingkai dan pose yang sama dengan foto), lalu
// menyusut dan menutup lagi. Gambar kedua digambar tepat di atas <img> pertama, jadi hanya tubuh yang
// berganti; latar tidak berubah. Dibuat sendiri dengan canvas 2D, tanpa WebGL/three.js. Isi (nama dan
// <img>) tetap HTML biasa sehingga tampil tanpa JavaScript; canvas hanya dekorasi.
export function LiquidMaskPortrait({
  children,
  back,
  bleed,
  className,
}: {
  children: ReactNode
  // alamat gambar kedua (satu origin dengan situs agar bisa digambar di canvas)
  back: string
  // ruang tambahan gambar kedua di luar bingkai foto, sebagai bagian lebar/tinggi foto (kiri-kanan, atas),
  // mis. jambul helm yang menjulang di atas foto
  bleed: { x: number; top: number }
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
    const layer = document.createElement('canvas')
    const bctx = layer.getContext('2d')
    if (!mctx || !bctx) return
    let photo: HTMLImageElement | null = null
    let blobs: Blob[] = []
    let pointer: { x: number; y: number } | null = null
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let last = 0
    let dirty = true
    let disposed = false

    let loading = false
    const load = () => {
      if (loading || disposed) return
      loading = true
      const next = new Image()
      next.decoding = 'async'
      next.onload = () => {
        if (disposed) return
        photo = next
        dirty = true
        // jejak yang dibuat sebelum gambar siap langsung terlihat
        if (blobs.length > 0) wake()
      }
      next.src = back
    }
    const timer = window.setTimeout(load, BACK_DELAY_MS)

    // susun lapisan kedua: bingkai gambar kedua = bingkai <img> pertama ditambah `bleed`, jadi wajah dan
    // tubuh tepat di posisi foto; bawahnya ikut memudar seperti foto (--hero-fade)
    const compose = () => {
      dirty = false
      bctx.setTransform(1, 0, 0, 1, 0, 0)
      bctx.clearRect(0, 0, layer.width, layer.height)
      if (!photo) return
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const area = root.getBoundingClientRect()
      const rect = img.getBoundingClientRect()
      const x = rect.left - area.left
      const y = rect.top - area.top
      bctx.save()
      bctx.drawImage(
        photo,
        x - rect.width * bleed.x,
        y - rect.height * bleed.top,
        rect.width * (1 + 2 * bleed.x),
        rect.height * (1 + bleed.top),
      )
      const fade = parseFloat(getComputedStyle(root).getPropertyValue('--hero-fade')) / 100 || 0
      if (fade > 0) {
        const top = y + rect.height * (1 - fade)
        const gradient = bctx.createLinearGradient(0, top, 0, y + rect.height)
        gradient.addColorStop(0, 'rgb(0 0 0 / 0)')
        gradient.addColorStop(0.5, 'rgb(0 0 0 / 0.55)')
        gradient.addColorStop(0.92, 'rgb(0 0 0 / 1)')
        bctx.globalCompositeOperation = 'destination-out'
        bctx.fillStyle = gradient
        // sama dengan gradasi bawah foto (.hero-portrait::after), selebar gambar kedua
        bctx.fillRect(
          x - rect.width * bleed.x,
          top,
          rect.width * (1 + 2 * bleed.x),
          y + rect.height - top,
        )
        bctx.globalCompositeOperation = 'source-over'
      }
      bctx.restore()
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      for (const c of [canvas, mask, layer]) {
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
      }
      dirty = true
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
      if (blobs.length === 0 || !photo) return
      if (dirty) compose()
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
      ctx.drawImage(layer, 0, 0)
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
      load()
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
      load()
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
      window.clearTimeout(timer)
      resizeObserver.disconnect()
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('pointerdown', onDown)
    }
  }, [back, bleed.x, bleed.top])

  return (
    <div ref={rootRef} className={cn('hero-mask', className)}>
      {children}
      <canvas ref={canvasRef} aria-hidden="true" className="hero-mask-canvas" />
    </div>
  )
}
