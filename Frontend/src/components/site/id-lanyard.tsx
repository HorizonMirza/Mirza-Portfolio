'use client'

import type { StaticImageData } from 'next/image'
import { useEffect, useRef } from 'react'

import { playLanyardSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

// Kartu ID bertali di samping form kontak (DESIGN.md bagian 36). Fisika ditulis sendiri tanpa
// library: tali berupa rantai titik verlet, kartu berupa batang kaku dua titik, sehingga kartu bisa
// ditarik, dilempar, berayun, berputar semu 3D, dan memantul pelan dari tepi.
// Tema gelap: kartu kaca + pita putih bertulisan hitam. Tema terang: kartu logam + pita hitam
// bertulisan putih (pilihan pemilik 2026-10-03, demo 5, 6, dan tampilan pita demo 10). Fisikanya
// standar (tali tidak melar, pantulan sedang), bukan fisika melayang demo 10.
// Murni hiasan: informasi yang sama ada di halaman lain, jadi disembunyikan dari pembaca layar.

const CARD_W = 200
const CARD_H = 300
const ROPE_LEN = 200
const ROPE_POINTS = 14
const ROPE_W = 16
const GRAVITY = 2100
const DAMPING = 0.992
const BOUNCE = 0.55
// kanvas lebih lebar dari kolom agar kartu bebas berayun; klik di luar kartu tetap tembus
const CANVAS_W = 560
const PHOTO_H = 160
// Tinggi dalam px, bukan rem: fisika memakai px, sedangkan rem menyusut di desktop (87,5%). Bila
// kotak lebih pendek dari tali + kartu + jarak tepi, kartu menyentuh lantai dan diam miring.
// jarak titik kartu dari tepi kanvas: setengah lebar kartu + ruang bayangan, agar sudut kartu dan
// bayangannya tidak pernah terpotong tepi kanvas (garis gelap di tepi)
const CARD_EDGE = CARD_W / 2 + 28
const BOX_H = ROPE_LEN + CARD_H + CARD_EDGE + 12
const SHADOW_SHIFT = 4000

type Point = { x: number; y: number; px: number; py: number; inv: number }

const point = (x: number, y: number, inv: number): Point => ({ x, y, px: x, py: y, inv })

// garis barcode yang tetap untuk teks yang sama (bukan kode sungguhan)
function barcode(text: string) {
  let seed = 0
  for (const ch of text) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0
  const bars: { x: number; w: number }[] = []
  let x = 0
  while (x < 176) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
    const w = 1 + ((seed >>> 16) % 3)
    bars.push({ x, w })
    x += w + 1 + ((seed >>> 20) % 3)
  }
  return bars
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// pecah teks menjadi baris yang muat di lebar tertentu
export function IdLanyard({
  name,
  role,
  photo,
  site,
  className,
}: {
  name: string
  role: string
  photo: string | StaticImageData
  site: string
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    const wrapEl = box.current
    if (!el || !wrapEl) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    const style = getComputedStyle(root)
    const fonts = {
      display: style.getPropertyValue('--font-oswald').trim() || 'Arial Narrow, sans-serif',
      mono: style.getPropertyValue('--font-jetbrains').trim() || 'monospace',
      sans: style.getPropertyValue('--font-inter').trim() || 'system-ui, sans-serif',
    }
    const img = new Image()
    img.src = typeof photo === 'string' ? photo : photo.src
    const bars = barcode(name + site)
    const ribbonText = ` ${site.toUpperCase()} ·`
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let visible = true
    let sleeping = false
    let still = 0

    // ===== fisika =====
    let ropes: Point[] = []
    let top = point(0, 0, 0.35)
    let bot = point(0, 0, 0.35)
    let anchor = { x: 0, y: 0 }
    let angPrev = Math.PI / 2
    let yaw = 0
    let grab: { p: Point; tx: number; ty: number } | null = null

    function build() {
      anchor = { x: width / 2, y: -2 }
      ropes = Array.from({ length: ROPE_POINTS + 1 }, (_, i) =>
        point(anchor.x, (ROPE_LEN * i) / ROPE_POINTS, i === 0 ? 0 : 1),
      )
      top = point(anchor.x, ROPE_LEN, 0.35)
      bot = point(anchor.x, ROPE_LEN + CARD_H, 0.35)
      if (!reduce) {
        // ayunan pembuka kecil saat halaman dibuka
        top.px -= 1
        bot.px += 3
      }
    }

    function resize() {
      const rect = el!.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      el!.width = Math.round(width * dpr)
      el!.height = Math.round(height * dpr)
    }

    function integrate(p: Point, dt: number) {
      if (p.inv === 0) return
      const vx = (p.x - p.px) * DAMPING
      const vy = (p.y - p.py) * DAMPING
      p.px = p.x
      p.py = p.y
      p.x += vx
      p.y += vy + GRAVITY * dt * dt
    }
    function link(a: Point, b: Point, len: number) {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 0.0001
      const diff = (d - len) / d
      const total = a.inv + b.inv || 1
      a.x += dx * diff * (a.inv / total)
      a.y += dy * diff * (a.inv / total)
      b.x -= dx * diff * (b.inv / total)
      b.y -= dy * diff * (b.inv / total)
    }
    function walls(p: Point, m = 6) {
      if (p.inv === 0) return
      if (p.x < m) {
        const v = p.x - p.px
        p.x = m
        p.px = m + v * BOUNCE
      }
      if (p.x > width - m) {
        const v = p.x - p.px
        p.x = width - m
        p.px = width - m + v * BOUNCE
      }
      // tepi atas juga dinding: kartu yang dilempar ke atas memantul turun
      if (p.y < m) {
        const v = p.y - p.py
        p.y = m
        p.py = m + v * BOUNCE
      }
      if (p.y > height - m) {
        const v = p.y - p.py
        p.y = height - m
        p.py = height - m + v * BOUNCE
      }
    }
    function step(dt: number) {
      const all = [...ropes, top, bot]
      for (const p of all) integrate(p, dt)
      if (grab) {
        grab.p.x += (grab.tx - grab.p.x) * 0.6
        grab.p.y += (grab.ty - grab.p.y) * 0.6
      }
      const seg = ROPE_LEN / ROPE_POINTS
      for (let k = 0; k < 10; k++) {
        ropes[0].x = anchor.x
        ropes[0].y = anchor.y
        for (let i = 0; i < ROPE_POINTS; i++) link(ropes[i], ropes[i + 1], seg)
        // ujung tali menempel ke klip kartu
        const end = ropes[ROPE_POINTS]
        const dx = top.x - end.x
        const dy = top.y - end.y
        end.x += dx * 0.7
        end.y += dy * 0.7
        top.x -= dx * 0.3
        top.y -= dy * 0.3
        link(top, bot, CARD_H)
        for (const p of ropes) walls(p)
        walls(top, CARD_EDGE)
        walls(bot, CARD_EDGE)
      }
      const ang = Math.atan2(bot.y - top.y, bot.x - top.x)
      let dA = ang - angPrev
      if (dA > Math.PI) dA -= 2 * Math.PI
      if (dA < -Math.PI) dA += 2 * Math.PI
      angPrev = ang
      const vx = top.x - top.px + (bot.x - bot.px)
      yaw += (Math.max(-1.1, Math.min(1.1, dA * 9 + vx * 0.012)) - yaw) * 0.12
    }
    function energy() {
      return (
        Math.abs(top.x - top.px) +
        Math.abs(top.y - top.py) +
        Math.abs(bot.x - bot.px) +
        Math.abs(bot.y - bot.py) +
        Math.abs(yaw)
      )
    }

    // ===== gambar =====
    function ropePath() {
      ctx!.beginPath()
      ctx!.moveTo(ropes[0].x, ropes[0].y)
      for (let i = 1; i < ropes.length - 1; i++) {
        const mx = (ropes[i].x + ropes[i + 1].x) / 2
        const my = (ropes[i].y + ropes[i + 1].y) / 2
        ctx!.quadraticCurveTo(ropes[i].x, ropes[i].y, mx, my)
      }
      ctx!.lineTo(ropes[ropes.length - 1].x, ropes[ropes.length - 1].y)
    }
    function drawRope(dark: boolean) {
      const c = ctx!
      c.lineCap = 'round'
      c.lineJoin = 'round'
      ropePath()
      c.strokeStyle = dark ? 'rgb(0 0 0 / 0.5)' : 'rgb(0 0 0 / 0.18)'
      c.lineWidth = ROPE_W + 2
      c.stroke()
      ropePath()
      c.strokeStyle = dark ? '#f5f5f5' : '#0a0a0a'
      c.lineWidth = ROPE_W
      c.stroke()
      // tulisan dicetak di sepanjang pita
      c.fillStyle = dark ? '#0a0a0a' : '#f5f5f5'
      c.font = `700 ${Math.round(ROPE_W * 0.55)}px ${fonts.mono}`
      c.textBaseline = 'middle'
      const charW = ROPE_W * 0.42
      let gap = 0
      let ci = 0
      for (let i = 0; i < ropes.length - 1; i++) {
        const a = ropes[i]
        const b = ropes[i + 1]
        const len = Math.hypot(b.x - a.x, b.y - a.y)
        const ang = Math.atan2(b.y - a.y, b.x - a.x)
        let pos = 0
        while (pos < len) {
          if (gap <= 0) {
            c.save()
            c.translate(a.x + Math.cos(ang) * pos, a.y + Math.sin(ang) * pos)
            c.rotate(ang)
            c.fillText(ribbonText[ci % ribbonText.length], 0, 0)
            c.restore()
            ci++
            gap = charW
          }
          const move = Math.min(gap, len - pos)
          if (move <= 0) break
          pos += move
          gap -= move
        }
      }
    }
    function drawCard(dark: boolean, shine: number) {
      const c = ctx!
      const x = -CARD_W / 2
      if (dark) {
        // kaca: tembus pandang dengan kilau yang ikut miring
        roundRect(c, x, 0, CARD_W, CARD_H, 16)
        c.fillStyle = 'rgb(255 255 255 / 0.12)'
        c.fill()
        c.strokeStyle = 'rgb(255 255 255 / 0.45)'
        c.lineWidth = 1.2
        c.stroke()
        c.save()
        roundRect(c, x, 0, CARD_W, CARD_H, 16)
        c.clip()
        const g = c.createLinearGradient(x + shine * CARD_W, 0, x + shine * CARD_W + 120, CARD_H)
        g.addColorStop(0, 'rgb(255 255 255 / 0)')
        g.addColorStop(0.5, 'rgb(255 255 255 / 0.3)')
        g.addColorStop(1, 'rgb(255 255 255 / 0)')
        c.fillStyle = g
        c.fillRect(x, 0, CARD_W, CARD_H)
        c.restore()
      } else {
        // logam: gradien abu tua
        roundRect(c, x, 0, CARD_W, CARD_H, 14)
        const g = c.createLinearGradient(x, 0, x + CARD_W, CARD_H)
        g.addColorStop(0, '#5b616b')
        g.addColorStop(0.5, '#2a2d33')
        g.addColorStop(1, '#14161a')
        c.fillStyle = g
        c.fill()
      }
      const ink = '#ffffff'
      const sub = 'rgb(255 255 255 / 0.72)'
      roundRect(c, -24, 12, 48, 7, 4)
      c.fillStyle = 'rgb(255 255 255 / 0.85)'
      c.fill()
      // foto
      c.save()
      roundRect(c, x + 12, 30, CARD_W - 24, PHOTO_H, 8)
      c.clip()
      c.fillStyle = 'rgb(255 255 255 / 0.08)'
      c.fillRect(x + 12, 30, CARD_W - 24, PHOTO_H)
      if (img.complete && img.naturalWidth) {
        const s = Math.max((CARD_W - 24) / img.naturalWidth, PHOTO_H / img.naturalHeight)
        const iw = img.naturalWidth * s
        const ih = img.naturalHeight * s
        c.drawImage(img, x + 12 + (CARD_W - 24 - iw) / 2, 30 + (PHOTO_H - ih) * 0.25, iw, ih)
      }
      c.restore()
      // nama satu baris (huruf mengecil bila tidak muat), peran di bawahnya (pilihan pemilik)
      c.textBaseline = 'top'
      c.fillStyle = ink
      const label = name.toUpperCase()
      let size = 19
      c.font = `700 ${size}px ${fonts.display}`
      while (size > 12 && c.measureText(label).width > CARD_W - 24) {
        size -= 0.5
        c.font = `700 ${size}px ${fonts.display}`
      }
      c.fillText(label, x + 12, PHOTO_H + 42)
      c.fillStyle = sub
      c.font = `600 10.5px ${fonts.sans}`
      c.fillText(role.toUpperCase(), x + 12, PHOTO_H + 66, CARD_W - 24)
      // barcode dan host di bagian bawah
      c.fillStyle = ink
      for (const b of bars) c.fillRect(x + 12 + b.x, CARD_H - 40, b.w, 18)
      c.fillStyle = sub
      c.font = `500 8.5px ${fonts.mono}`
      c.textAlign = 'center'
      c.fillText(site.toUpperCase().split('').join(' '), 0, CARD_H - 17)
      c.textAlign = 'left'
    }
    function draw() {
      const c = ctx!
      const dark = root.classList.contains('dark')
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, width, height)
      drawRope(dark)
      const ang = Math.atan2(bot.y - top.y, bot.x - top.x) - Math.PI / 2
      const turn = yaw * 0.55
      const sx = Math.max(0.05, Math.abs(Math.cos(turn)))
      c.save()
      c.translate(top.x, top.y)
      c.rotate(ang)
      c.scale(sx, 1)
      // Bayangan memakai shadowBlur, bukan ctx.filter: filter blur meninggalkan garis sisa di
      // sebagian GPU (Chrome Windows) dan tidak didukung Safari. Bentuk kartu digambar jauh di
      // luar kanvas, lalu hanya bayangannya yang digeser masuk, agar kartu kaca tetap tembus pandang.
      c.save()
      const t = c.getTransform()
      c.setTransform(t.a, t.b, t.c, t.d, t.e - SHADOW_SHIFT * dpr, t.f)
      roundRect(c, -CARD_W / 2, 0, CARD_W, CARD_H, 14)
      c.shadowColor = dark ? 'rgb(0 0 0 / 0.55)' : 'rgb(0 0 0 / 0.25)'
      c.shadowBlur = 20 * dpr
      c.shadowOffsetX = (SHADOW_SHIFT + 8) * dpr
      c.shadowOffsetY = 12 * dpr
      c.fillStyle = '#000'
      c.fill()
      c.restore()
      drawCard(dark, (Math.sin(turn) + 1) / 2)
      c.restore()
      // pengait logam
      c.fillStyle = '#9aa0a8'
      c.beginPath()
      c.arc(top.x, top.y, 5, 0, Math.PI * 2)
      c.fill()
    }

    // ===== perulangan: berhenti saat diam atau tidak terlihat =====
    let last = 0
    let acc = 0
    function loop(now: number) {
      const dt = 1 / 120
      acc += Math.min(0.05, last ? (now - last) / 1000 : dt)
      last = now
      while (acc >= dt) {
        step(dt)
        acc -= dt
      }
      draw()
      // berhenti hanya setelah diam ~0,5 detik berturut-turut: di puncak ayunan kecepatan sesaat nol,
      // dan berhenti di situ membuat kartu membeku miring
      still = !grab && energy() < 0.02 ? still + 1 : 0
      if (still > 30) {
        still = 0
        sleeping = true
        frame = 0
        last = 0
        return
      }
      frame = visible ? requestAnimationFrame(loop) : 0
    }
    function wake() {
      sleeping = false
      if (!frame && visible) {
        last = 0
        frame = requestAnimationFrame(loop)
      }
    }

    // ===== interaksi (kanvas tidak menangkap klik agar form di sebelahnya tetap bisa diklik) =====
    function local(e: PointerEvent) {
      const r = el!.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    function hit(m: { x: number; y: number }) {
      const ang = Math.atan2(bot.y - top.y, bot.x - top.x) - Math.PI / 2
      const dx = m.x - top.x
      const dy = m.y - top.y
      const lx = dx * Math.cos(-ang) - dy * Math.sin(-ang)
      const ly = dx * Math.sin(-ang) + dy * Math.cos(-ang)
      return Math.abs(lx) <= CARD_W / 2 + 4 && ly >= -4 && ly <= CARD_H + 4 ? ly / CARD_H : null
    }
    function onDown(e: PointerEvent) {
      if (reduce || e.button !== 0) return
      const m = local(e)
      const t = hit(m)
      if (t === null) return
      e.preventDefault()
      grab = { p: t < 0.5 ? top : bot, tx: m.x, ty: m.y }
      root.style.cursor = 'grabbing'
      playLanyardSound('grab')
      wake()
    }
    function onMove(e: PointerEvent) {
      const m = local(e)
      if (grab) {
        grab.tx = m.x
        grab.ty = m.y
        return
      }
      if (!reduce) root.style.cursor = hit(m) !== null ? 'grab' : ''
    }
    function onUp() {
      if (!grab) return
      grab = null
      root.style.cursor = ''
      playLanyardSound('release')
      wake()
    }

    resize()
    build()
    draw()
    img.onload = () => draw()
    if (!reduce) frame = requestAnimationFrame(loop)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && wrapEl.offsetParent !== null
      if (visible && !sleeping) wake()
    })
    io.observe(wrapEl)
    const ro = new ResizeObserver(() => {
      resize()
      build()
      draw()
      if (!reduce) wake()
    })
    ro.observe(el)
    // tema berganti: gambar ulang dengan warna tema baru
    const mo = new MutationObserver(() => draw())
    mo.observe(root, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      root.style.cursor = ''
    }
  }, [name, role, photo, site])

  return (
    <div
      ref={box}
      aria-hidden="true"
      className={cn('relative z-10 select-none', className)}
      style={{ height: BOX_H }}
    >
      <canvas
        ref={canvas}
        className="pointer-events-none absolute top-0 left-1/2 h-full -translate-x-1/2"
        style={{ width: CANVAS_W }}
      />
    </div>
  )
}
