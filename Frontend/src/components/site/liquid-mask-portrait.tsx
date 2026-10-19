'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

// jejak: umur (detik), jari-jari seukuran ujung kursor (3% sisi pendek, 12–20 px), jarak antartitik,
// jumlah maksimum (revisi pemilik 2026-10-19: lebih lama, lebih kecil)
const BLOB_LIFE = 2.2
const BLOB_LIFE_REDUCED = 0.3
const BLOB_RADIUS = 0.03
const BLOB_MIN = 12
const BLOB_MAX = 20
const BLOB_STEP = 4
const MAX_BLOBS = 260
// gaya "Kabut" (demo bentuk 9): padat sampai 40% jari-jari luar lalu memudar sampai 1,8× jari-jari
const FOG_REACH = 1.8
// gambar kedua dimuat setelah halaman tenang (atau saat pertama disentuh), bukan saat halaman dibuka
const BACK_DELAY_MS = 1200
// tanda bisa di-hover (pilihan pemilik "intip berkala"): armor mengintip di pipi kiri dan kanan saat
// halaman tenang sekian lama; posisi pipi sebagai bagian bingkai foto
const PEEK_IDLE_MS = 6000
const PEEK_FIRST_MS = 1800
const CHEEKS = [
  { x: 0.395, y: 0.41 },
  { x: 0.585, y: 0.41 },
] as const

type Blob = { x: number; y: number; r: number; life: number }

// Hero dengan efek "liquid mask" (permintaan pemilik 2026-10-18, seperti komponen HoverMaskReveal dan
// ibnuhakim.id): kursor atau jari di mana saja di hero, termasuk di belakang navbar, meninggalkan jejak
// kecil berkabut yang membuka gambar kedua (`back`, sejak 2026-10-19 foto armor dengan bingkai dan pose yang sama dengan foto), lalu
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
    const img = root?.querySelector<HTMLImageElement>('figure img')
    if (!root || !canvas || !ctx || !img) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mask = document.createElement('canvas')
    const mctx = mask.getContext('2d')
    const layer = document.createElement('canvas')
    const bctx = layer.getContext('2d')
    const silhouette = document.createElement('canvas')
    const sctx = silhouette.getContext('2d')
    if (!mctx || !bctx || !sctx) return
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
    // intip pertama menunggu gambar kedua siap
    let wantPeek = false
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
        if (wantPeek) {
          wantPeek = false
          peek()
        }
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
      const style = getComputedStyle(root)
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
      const fade = parseFloat(style.getPropertyValue('--hero-fade')) / 100 || 0
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
      // di luar tubuh jejak tetap terlihat sebagai bentuk cair tipis (seperti referensi); digambar di
      // belakang armor setelah gradasi agar tidak ikut terhapus. Warna dari --hero-trail sesuai tema.
      const trail = style.getPropertyValue('--hero-trail').trim()
      if (trail) {
        bctx.globalCompositeOperation = 'destination-over'
        bctx.fillStyle = trail
        bctx.fillRect(0, 0, width, height)
      }
      // Paling belakang: siluet foto pertama berwarna latar halaman, jadi di dalam jejak foto benar-benar
      // berganti dan bagian yang tidak tertutup armor (mis. telinga) hilang (permintaan pemilik 2026-10-19)
      sctx.setTransform(1, 0, 0, 1, 0, 0)
      sctx.clearRect(0, 0, silhouette.width, silhouette.height)
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sctx.globalCompositeOperation = 'source-over'
      sctx.drawImage(img, x, y, rect.width, rect.height)
      sctx.globalCompositeOperation = 'source-in'
      sctx.fillStyle = getComputedStyle(document.body).backgroundColor
      sctx.fillRect(0, 0, width, height)
      bctx.setTransform(1, 0, 0, 1, 0, 0)
      bctx.globalCompositeOperation = 'destination-over'
      bctx.drawImage(silhouette, 0, 0)
      bctx.globalCompositeOperation = 'source-over'
      bctx.restore()
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      for (const c of [canvas, mask, layer, silhouette]) {
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
      }
      dirty = true
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    // ganti tema (kelas di <html>) mengubah warna jejak dan gradasi: susun ulang lapisan kedua
    const themeObserver = new MutationObserver(() => {
      dirty = true
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    const add = (x: number, y: number, strength = 1) => {
      const r = Math.min(BLOB_MAX, Math.max(BLOB_MIN, Math.min(width, height) * BLOB_RADIUS))
      blobs.push({ x, y, r: r * strength, life: 1 })
      if (blobs.length > MAX_BLOBS) blobs.splice(0, blobs.length - MAX_BLOBS)
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (blobs.length === 0 || !photo) return
      if (dirty) compose()
      mctx.setTransform(1, 0, 0, 1, 0, 0)
      mctx.clearRect(0, 0, mask.width, mask.height)
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (const b of blobs) {
        const r = b.r * Math.pow(b.life, 0.6) * FOG_REACH
        if (r < 0.5) continue
        // tepi berkabut: gradien radial menggantikan blur (yang belum ada di canvas Safari)
        const gradient = mctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r)
        gradient.addColorStop(0, 'rgb(0 0 0 / 1)')
        gradient.addColorStop(0.4, 'rgb(0 0 0 / 1)')
        gradient.addColorStop(0.6, 'rgb(0 0 0 / 0.45)')
        gradient.addColorStop(0.8, 'rgb(0 0 0 / 0.12)')
        gradient.addColorStop(1, 'rgb(0 0 0 / 0)')
        mctx.fillStyle = gradient
        mctx.fillRect(b.x - r, b.y - r, r * 2, r * 2)
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
      draw()
      if (blobs.length > 0) frame = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(loop)
    }

    // area efek = seluruh hero termasuk di belakang navbar; header menutupi root, jadi kejadian penunjuk
    // dibaca dari window lalu dicek apakah di dalam root
    const local = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const p = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      return p.x >= 0 && p.y >= 0 && p.x <= rect.width && p.y <= rect.height ? p : null
    }
    let idle = performance.now()
    const onMove = (e: PointerEvent) => {
      const p = local(e)
      if (!p) {
        pointer = null
        return
      }
      load()
      idle = performance.now()
      if (pointer) {
        // isi jarak antar-kejadian agar jejak tidak putus saat kursor cepat
        const dx = p.x - pointer.x
        const dy = p.y - pointer.y
        const steps = Math.max(1, Math.min(24, Math.floor(Math.hypot(dx, dy) / BLOB_STEP)))
        for (let i = 1; i <= steps; i++)
          add(pointer.x + (dx * i) / steps, pointer.y + (dy * i) / steps)
      } else add(p.x, p.y)
      pointer = p
      wake()
    }
    const onLeave = () => {
      pointer = null
    }
    const onDown = (e: PointerEvent) => {
      const p = local(e)
      if (!p) return
      load()
      idle = performance.now()
      add(p.x, p.y, 1.4)
      wake()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    // intip berkala di kedua pipi, hanya saat hero terlihat, tab aktif, dan tanpa reduced-motion
    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
    })
    io.observe(root)
    const peek = () => {
      if (!photo || !visible || reduce.matches || document.visibilityState !== 'visible') return
      const area = root.getBoundingClientRect()
      const rect = img.getBoundingClientRect()
      for (const cheek of CHEEKS) {
        const cx = rect.left - area.left + rect.width * cheek.x
        const cy = rect.top - area.top + rect.height * cheek.y
        for (let k = 0; k < 7; k++) {
          add(cx + Math.cos(k) * BLOB_MAX * 0.8, cy + Math.sin(k * 1.7) * BLOB_MAX * 1.1, 1.25)
        }
      }
      idle = performance.now()
      wake()
    }
    const firstPeek = window.setTimeout(() => {
      load()
      if (photo) peek()
      else wantPeek = true
    }, PEEK_FIRST_MS)
    const peekTimer = window.setInterval(() => {
      if (performance.now() - idle >= PEEK_IDLE_MS) peek()
    }, 500)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.clearTimeout(firstPeek)
      window.clearInterval(peekTimer)
      resizeObserver.disconnect()
      themeObserver.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [back, bleed.x, bleed.top])

  return (
    <div ref={rootRef} className={cn('hero-mask', className)}>
      {children}
      <canvas ref={canvasRef} aria-hidden="true" className="hero-mask-canvas" />
    </div>
  )
}
