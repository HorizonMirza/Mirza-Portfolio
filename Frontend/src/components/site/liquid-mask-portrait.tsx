'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { isScrolling } from '@/lib/scroll-idle'
import { cn } from '@/lib/utils'

import { createHeroFluid, type HeroFluid } from './hero-fluid'

// jejak: umur (detik), jari-jari (4,5% sisi pendek, 18–30 px; 1,5× ukuran ujung kursor sebelumnya),
// jarak antartitik, jumlah maksimum (revisi pemilik 2026-10-19)
const BLOB_LIFE = 2.2
const BLOB_LIFE_REDUCED = 0.3
const BLOB_RADIUS = 0.045
const BLOB_MIN = 18
const BLOB_MAX = 30
const BLOB_STEP = 4
const MAX_BLOBS = 260
// cadangan tanpa WebGL2, gaya "Kabut" (demo bentuk 9): padat sampai 40% jari-jari luar lalu memudar
// sampai 1,8× jari-jari
const FOG_REACH = 1.8
// Simulasi cairan (hero-fluid.ts, revisi pemilik 2026-10-20 "persis seperti Crazy Hover Mask Reveal"):
// jari-jari tepi percikan sama dengan tepi kabut sebelumnya (±1,05× BLOB_RADIUS, ukuran tidak diubah),
// sebagian kecepatan kursor ikut mendorong cairan, pusaran sedang, dan butiran tipis di tepi.
const FLUID_EDGE = 1.05
const FLUID_PUSH = 0.2
const FLUID_SWIRL = 28
const FLUID_GRAIN = 0.05
const FLUID_STEP = 6
// gambar kedua dimuat setelah halaman tenang (atau saat pertama disentuh), bukan saat halaman dibuka
const BACK_DELAY_MS = 1200
// resolusi masker jejak terhadap piksel CSS
const MASK_SCALE = 0.5
// tanda bisa di-hover (pilihan pemilik 2026-10-21 dari 10 demo letak intip: nomor 3 "Visor mata"):
// sapuan mendatar menyapu kacamata dari kiri ke kanan dalam 0,8 detik, sehingga celah mata helm terlihat.
// Intip pertama 3 detik setelah beranda benar-benar terlihat (pemberitahuan pembuka sudah ditutup), lalu
// tiap 8 detik selama kursor diam. Titik diukur di foto 1120×1100: kacamata x 385–690, mata ±y 370.
const PEEK_EVERY_MS = 8000
const PEEK_FIRST_MS = 3000
const VISOR = [
  { x: 360 / 1120, y: 372 / 1100 },
  { x: 540 / 1120, y: 380 / 1100 },
  { x: 720 / 1120, y: 372 / 1100 },
] as const
const VISOR_MS = 800
const VISOR_SIZE = 1.3

type Blob = { x: number; y: number; r: number; life: number }

// Hero dengan efek "liquid mask" (permintaan pemilik 2026-10-18, seperti komponen HoverMaskReveal dan
// ibnuhakim.id): kursor atau jari di mana saja di hero, termasuk di belakang navbar, meninggalkan jejak
// cair yang membuka gambar kedua (`back`, sejak 2026-10-19 foto armor dengan bingkai dan pose yang sama dengan
// foto), lalu menyusut dan menutup lagi. Sejak 2026-10-20 jejaknya simulasi cairan WebGL2 bertepi tajam
// (hero-fluid.ts, seperti Crazy Hover Mask Reveal); tanpa WebGL2 memakai kabut canvas 2D. Gambar kedua
// digambar tepat di atas <img> pertama, jadi hanya tubuh yang berganti; latar tidak berubah. Isi (nama
// dan <img>) tetap HTML biasa sehingga tampil tanpa JavaScript; canvas hanya dekorasi.
export function LiquidMaskPortrait({
  children,
  back,
  bleed,
  className,
}: {
  children: ReactNode
  // alamat gambar kedua (satu origin dengan situs, atau Cloudinary yang mengirim header CORS)
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
    let canvas = canvasRef.current
    const img = root?.querySelector<HTMLImageElement>('figure img')
    if (!root || !canvas || !img) return
    const reactCanvas = canvas
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const layer = document.createElement('canvas')
    const bctx = layer.getContext('2d')
    const silhouette = document.createElement('canvas')
    const sctx = silhouette.getContext('2d')
    if (!bctx || !sctx) return
    const fluidOptions = () => ({
      life: reduce.matches ? BLOB_LIFE_REDUCED : BLOB_LIFE,
      swirl: reduce.matches ? 0 : FLUID_SWIRL,
      grain: FLUID_GRAIN,
    })
    // WebGL2 dicek di canvas uji dulu: canvas yang sudah memegang konteks WebGL tidak bisa dipakai 2D
    let fluid: HeroFluid | null = null
    // canvas cadangan 2D buatan efek ini sendiri (hanya bila shader gagal), dibongkar saat cleanup
    let fallback: HTMLCanvasElement | null = null
    const probe = document.createElement('canvas').getContext('webgl2')
    if (
      probe?.getExtension('EXT_color_buffer_float') ||
      probe?.getExtension('EXT_color_buffer_half_float')
    ) {
      fluid = createHeroFluid(canvas, fluidOptions())
      if (!fluid) {
        // Konteks WebGL sudah terpasang tetapi shader gagal: cadangan 2D digambar di canvas baru yang
        // disisipkan di sebelahnya. Canvas milik React cukup disembunyikan, tidak diganti, agar
        // rekonsiliasi React tidak kehilangan simpulnya (audit 2026-10-31, BUG-06).
        fallback = document.createElement('canvas')
        fallback.className = canvas.className
        fallback.setAttribute('aria-hidden', 'true')
        reactCanvas.after(fallback)
        reactCanvas.hidden = true
        canvas = fallback
      }
    }
    probe?.getExtension('WEBGL_lose_context')?.loseContext()
    const out = canvas
    const ctx = fluid ? null : out.getContext('2d')
    const mask = document.createElement('canvas')
    const mctx = fluid ? null : mask.getContext('2d')
    if (!fluid && (!ctx || !mctx)) return
    let photo: HTMLImageElement | null = null
    let blobs: Blob[] = []
    let pointer: { x: number; y: number; t: number } | null = null
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let last = 0
    // kapan percikan terakhir dibuat: simulasi berhenti setelah semua percikan hilang
    let lastSplat = -Infinity
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
      // gambar unggahan admin datang dari Cloudinary: tanpa CORS canvas dan WebGL menolaknya
      next.crossOrigin = 'anonymous'
      next.onload = () => {
        if (disposed) return
        photo = next
        dirty = true
        // jejak yang dibuat sebelum gambar siap langsung terlihat
        if (blobs.length > 0 || performance.now() - lastSplat < 3000) wake()
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
      fluid?.setLayer(layer)
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      for (const c of [layer, silhouette]) {
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
      }
      if (fluid) {
        fluid.resize(width, height, dpr)
      } else {
        out.width = Math.round(width * dpr)
        out.height = Math.round(height * dpr)
        // masker kabut cukup setengah resolusi CSS: tepinya memang lembut, dan jauh lebih ringan
        mask.width = Math.max(1, Math.round(width * MASK_SCALE))
        mask.height = Math.max(1, Math.round(height * MASK_SCALE))
      }
      dirty = true
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    // ganti tema (kelas di <html>) mengubah warna jejak dan gradasi: susun ulang lapisan kedua
    const themeObserver = new MutationObserver(() => {
      dirty = true
      if (fluid && performance.now() - lastSplat < 4000) wake()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    const onMotionPref = () => fluid?.setOptions(fluidOptions())
    reduce.addEventListener('change', onMotionPref)

    const baseRadius = () =>
      Math.min(BLOB_MAX, Math.max(BLOB_MIN, Math.min(width, height) * BLOB_RADIUS))
    // satu percikan: cairan (dengan dorongan kecepatan) atau blob kabut cadangan
    const add = (x: number, y: number, strength = 1, vx = 0, vy = 0) => {
      const r = baseRadius() * strength
      lastSplat = performance.now()
      if (fluid) {
        fluid.splat(x, y, r * FLUID_EDGE, vx * FLUID_PUSH, vy * FLUID_PUSH)
        return
      }
      blobs.push({ x, y, r, life: 1 })
      if (blobs.length > MAX_BLOBS) blobs.splice(0, blobs.length - MAX_BLOBS)
    }

    const drawFog = () => {
      if (!ctx || !mctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, out.width, out.height)
      if (blobs.length === 0 || !photo) return
      if (dirty) compose()
      mctx.setTransform(1, 0, 0, 1, 0, 0)
      mctx.clearRect(0, 0, mask.width, mask.height)
      mctx.setTransform(MASK_SCALE, 0, 0, MASK_SCALE, 0, 0)
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
      ctx.drawImage(mask, 0, 0, out.width, out.height)
      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = (time: number) => {
      frame = 0
      const dt = Math.min(0.05, (time - last) / 1000)
      last = time
      const life = reduce.matches ? BLOB_LIFE_REDUCED : BLOB_LIFE
      if (fluid) {
        // selama halaman digulir cairan tidak dihitung dan tidak digambar (hero biasanya keluar layar)
        if (!isScrolling() && dt > 0) {
          if (dirty && photo) compose()
          fluid.step(dt)
          fluid.render()
        }
        // semua percikan sudah di bawah ambang: kosongkan dan berhenti sampai ada gerakan lagi
        if (time - lastSplat > life * 1000 * 1.6 + 400) {
          fluid.clear()
          return
        }
        frame = requestAnimationFrame(loop)
        return
      }
      for (const b of blobs) b.life -= dt / life
      blobs = blobs.filter((b) => b.life > 0)
      // selama halaman digulir jejak tetap menua tetapi tidak digambar ulang
      if (!isScrolling()) drawFog()
      if (blobs.length > 0) frame = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (frame || !photo) return
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
      const now = performance.now()
      idle = now
      if (pointer) {
        // isi jarak antar-kejadian agar jejak tidak putus saat kursor cepat
        const dx = p.x - pointer.x
        const dy = p.y - pointer.y
        const seconds = Math.max(0.008, (now - pointer.t) / 1000)
        const vx = dx / seconds
        const vy = dy / seconds
        const gap = fluid ? FLUID_STEP : BLOB_STEP
        const steps = Math.max(1, Math.min(fluid ? 12 : 24, Math.floor(Math.hypot(dx, dy) / gap)))
        for (let i = 1; i <= steps; i++)
          add(pointer.x + (dx * i) / steps, pointer.y + (dy * i) / steps, 1, vx, vy)
      } else add(p.x, p.y)
      pointer = { ...p, t: now }
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

    // intip berkala (visor mata), hanya saat hero terlihat, tab aktif, pemberitahuan pembuka sudah
    // ditutup, dan tanpa reduced-motion
    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      syncPeekTimer()
    })
    io.observe(root)
    const introOpen = () =>
      document.documentElement.hasAttribute('data-intro') ||
      Boolean(document.querySelector('.intro[open]'))
    const canPeek = () =>
      visible && !reduce.matches && document.visibilityState === 'visible' && !introOpen()
    let lastPeek = -Infinity
    let sweep = 0
    const peek = () => {
      if (!photo || !canPeek()) return
      const area = root.getBoundingClientRect()
      const rect = img.getBoundingClientRect()
      const pts = VISOR.map((v) => ({
        x: rect.left - area.left + rect.width * v.x,
        y: rect.top - area.top + rect.height * v.y,
      }))
      const lens = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i]!.x, q.y - pts[i]!.y))
      const total = lens.reduce((sum, l) => sum + l, 0)
      const speed = total / (VISOR_MS / 1000)
      const gap = fluid ? FLUID_STEP : BLOB_STEP
      const start = performance.now()
      let done = 0
      // "kursor tak terlihat" bergerak di sepanjang garis kacamata, sama seperti jejak hover sungguhan
      const tick = () => {
        sweep = 0
        if (disposed) return
        const target = total * Math.min(1, (performance.now() - start) / VISOR_MS)
        while (done < target) {
          done = Math.min(target, done + gap)
          let d = done
          let i = 0
          while (i < lens.length - 1 && d > lens[i]!) {
            d -= lens[i]!
            i++
          }
          const a = pts[i]!
          const b = pts[i + 1]!
          const len = lens[i] || 1
          const f = d / len
          add(
            a.x + (b.x - a.x) * f,
            a.y + (b.y - a.y) * f,
            VISOR_SIZE,
            ((b.x - a.x) / len) * speed,
            ((b.y - a.y) / len) * speed,
          )
        }
        wake()
        if (done < total) sweep = requestAnimationFrame(tick)
      }
      cancelAnimationFrame(sweep)
      sweep = requestAnimationFrame(tick)
      lastPeek = performance.now()
      idle = lastPeek
    }
    // 3 detik terhitung sejak beranda terlihat tanpa pemberitahuan pembuka di depannya
    let readySince: number | null = null
    let peekTimer = 0
    const peekTick = () => {
      const now = performance.now()
      if (!canPeek()) {
        if (lastPeek === -Infinity) readySince = null
        return
      }
      if (lastPeek === -Infinity) {
        readySince ??= now
        if (now - readySince < PEEK_FIRST_MS) return
        load()
        if (photo) peek()
        else wantPeek = true
        return
      }
      if (now - lastPeek >= PEEK_EVERY_MS && now - idle >= PEEK_EVERY_MS) peek()
    }
    // Pemeriksa 250 ms hanya berjalan saat hero terlihat dan tab aktif; sebelumnya tetap berdetak
    // walau hero sudah jauh di luar layar (audit 2026-10-31, EFF-04)
    function syncPeekTimer() {
      const run = visible && document.visibilityState === 'visible'
      if (run && !peekTimer) {
        peekTimer = window.setInterval(peekTick, 250)
      } else if (!run && peekTimer) {
        window.clearInterval(peekTimer)
        peekTimer = 0
        // hitungan 3 detik intip pertama dimulai ulang saat hero terlihat lagi
        if (lastPeek === -Infinity) readySince = null
      }
    }
    syncPeekTimer()
    document.addEventListener('visibilitychange', syncPeekTimer)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      cancelAnimationFrame(sweep)
      window.clearTimeout(timer)
      window.clearInterval(peekTimer)
      document.removeEventListener('visibilitychange', syncPeekTimer)
      resizeObserver.disconnect()
      themeObserver.disconnect()
      reduce.removeEventListener('change', onMotionPref)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      fluid?.dispose()
      if (fallback) {
        fallback.remove()
        reactCanvas.hidden = false
      }
    }
  }, [back, bleed.x, bleed.top])

  return (
    <div ref={rootRef} className={cn('hero-mask', className)}>
      {children}
      <canvas ref={canvasRef} aria-hidden="true" className="hero-mask-canvas" />
    </div>
  )
}
