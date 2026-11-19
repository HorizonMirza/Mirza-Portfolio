// Mesin kartu ID: menata kanvas di sekitar kolom, menjalankan fisika tali dan kartu, menggambar
// tiap bingkai, berhenti saat diam atau tidak terlihat, dan menangani tarik/lempar kartu. Dibuat
// sekali per mount oleh index.tsx; jabatan, foto, dan mode ubah dibaca lewat ref.

import type { RefObject } from 'react'

import { playLanyardSound } from '@/lib/ui-sounds'

import { barcode, type CardContent, drawCard, drawRope, roundRect } from './drawing'
import {
  BOX_H,
  CARD_EDGE,
  CARD_H,
  CARD_W,
  cardFloor,
  EXTRA_BOTTOM,
  integrate,
  link,
  PHOTO_H,
  point,
  type Point,
  ROPE_LEN,
  ROPE_POINTS,
  SCREEN_GAP,
  SIDE_MAX,
  walls,
} from './physics'

// bentuk bayangan digambar sejauh ini di luar kanvas, lalu hanya bayangannya yang digeser masuk
const SHADOW_SHIFT = 4000

export type LanyardEditable = { onPhoto: () => void }

export type LanyardEngine = {
  redraw: () => void
  setPhoto: (src: string) => void
  destroy: () => void
}

export function createLanyard({
  canvas: el,
  box: wrapEl,
  name,
  site,
  photoCrop,
  photoRef,
  roleRef,
  editRef,
}: {
  canvas: HTMLCanvasElement
  box: HTMLDivElement
  name: string
  site: string
  photoCrop?: CardContent['crop']
  photoRef: RefObject<string>
  roleRef: RefObject<string>
  editRef: RefObject<LanyardEditable | undefined>
}): LanyardEngine | null {
  const ctx = el.getContext('2d')
  if (!ctx) return null
  // kartu diam bila gerakan dikurangi atau di pratinjau admin
  const reduce =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(editRef.current)
  const root = document.documentElement
  const style = getComputedStyle(root)
  const fonts = {
    display: style.getPropertyValue('--font-oswald').trim() || 'Arial Narrow, sans-serif',
    mono: style.getPropertyValue('--font-jetbrains').trim() || 'monospace',
    sans: style.getPropertyValue('--font-inter').trim() || 'system-ui, sans-serif',
  }
  const img = new Image()
  img.src = photoRef.current
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
  // jarak tengah kolom (titik gantung tali) dari tepi kiri kanvas
  let anchorX = 0
  let angPrev = Math.PI / 2
  let yaw = 0
  let grab: { p: Point; tx: number; ty: number } | null = null

  function build() {
    anchor = { x: anchorX, y: -2 }
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

  // Pratinjau admin memperkecil halaman lewat transform (SiteFrame, kelas .site-ui): semua ukuran
  // dihitung dalam satuan tata letak (dibagi skala) dan "layar" adalah bingkainya. Di situs publik
  // tidak ada bingkai dan skalanya 1.
  const frameEl = wrapEl.closest<HTMLElement>('.site-ui')
  function scaleOf() {
    if (!frameEl || !frameEl.offsetWidth) return 1
    const k = frameEl.getBoundingClientRect().width / frameEl.offsetWidth
    return Math.abs(k - 1) < 0.02 ? 1 : k
  }
  function resize() {
    // lebar area tarik dihitung dari posisi kolom di layar
    const k = scaleOf()
    const box = wrapEl.getBoundingClientRect()
    const frameLeft = frameEl ? frameEl.getBoundingClientRect().left : 0
    const boxW = box.width / k
    const center = (box.left - frameLeft) / k + boxW / 2
    const screenW = frameEl ? frameEl.offsetWidth : document.documentElement.clientWidth
    const least = CARD_EDGE + SCREEN_GAP
    const left = Math.max(least, Math.min(SIDE_MAX, center - SCREEN_GAP))
    const right = Math.max(least, Math.min(SIDE_MAX, screenW - center - SCREEN_GAP))
    anchorX = left
    el.style.left = `${boxW / 2 - left}px`
    el.style.width = `${left + right}px`
    // batas bawah: garis atas footer situs (border-top), minimal setinggi kotak kartu
    const footer = (frameEl ?? document).querySelector('body footer, footer')
    const floor = footer ? (footer.getBoundingClientRect().top - box.top) / k : BOX_H + EXTRA_BOTTOM
    el.style.height = `${Math.max(BOX_H, Math.round(floor))}px`
    const rect = el.getBoundingClientRect()
    dpr = Math.min(2, window.devicePixelRatio || 1)
    width = rect.width / k
    height = rect.height / k
    el.width = Math.round(width * dpr)
    el.height = Math.round(height * dpr)
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
      for (const p of ropes) walls(p, width, height)
      // titik kartu: bawah hanya dijaga tipis, sudut terbawah kartu dijaga cardFloor()
      walls(top, width, height, CARD_EDGE, 6)
      walls(bot, width, height, CARD_EDGE, 6)
      cardFloor(top, bot, height)
    }
    // putaran semu 3D mengikuti kecepatan sudut dan geser samping kartu
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
  function draw() {
    const c = ctx!
    const dark = root.classList.contains('dark')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, width, height)
    drawRope(c, ropes, dark, ribbonText, fonts)
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
    const editing = Boolean(editRef.current)
    drawCard(c, dark, (Math.sin(turn) + 1) / 2, {
      img,
      crop: photoCrop,
      name,
      role: editing ? null : roleRef.current,
      editing,
      site,
      bars,
      fonts,
    })
    c.restore()
    // pengait logam
    c.fillStyle = '#9aa0a8'
    c.beginPath()
    c.arc(top.x, top.y, 5, 0, Math.PI * 2)
    c.fill()
  }

  // ===== perulangan: langkah fisika tetap 1/120 dtk, berhenti saat diam atau tidak terlihat =====
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
  function local(e: PointerEvent | MouseEvent) {
    const r = el.getBoundingClientRect()
    const k = scaleOf()
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }
  }
  // titik pada bidang kartu (bukan kanvas): lx dari tengah kartu, ly dari tepi atas kartu
  function onCard(m: { x: number; y: number }) {
    const ang = Math.atan2(bot.y - top.y, bot.x - top.x) - Math.PI / 2
    const dx = m.x - top.x
    const dy = m.y - top.y
    return {
      lx: dx * Math.cos(-ang) - dy * Math.sin(-ang),
      ly: dx * Math.sin(-ang) + dy * Math.cos(-ang),
    }
  }
  // posisi di kartu (0 atas .. 1 bawah) bila titik mengenai kartu, selain itu null
  function hit(m: { x: number; y: number }) {
    const { lx, ly } = onCard(m)
    return Math.abs(lx) <= CARD_W / 2 + 4 && ly >= -4 && ly <= CARD_H + 4 ? ly / CARD_H : null
  }
  // foto kartu ditekan di pratinjau admin (kartu diam, jadi cukup bidang kartu)
  function onPhotoArea(m: { x: number; y: number }) {
    if (!editRef.current) return false
    const { lx, ly } = onCard(m)
    return Math.abs(lx) <= CARD_W / 2 - 9 && ly >= 27 && ly <= 27 + PHOTO_H + 6
  }
  // Kotak kartu disembunyikan di layar kecil (`hidden lg:block`), tetapi pendengar pointer ada di
  // window: tanpa pemeriksaan ini sentuhan di pojok kiri atas HP "mengenai" kartu tak terlihat dan
  // menahan gulir lewat preventDefault.
  function shown() {
    return wrapEl.offsetParent !== null && width > 0
  }
  function onDown(e: PointerEvent) {
    if (reduce || e.button !== 0 || !visible || !shown()) return
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
    if (!grab && (!visible || !shown())) return
    const m = local(e)
    if (grab) {
      grab.tx = m.x
      grab.ty = m.y
      return
    }
    if (editRef.current) {
      root.style.cursor = onPhotoArea(m) ? 'pointer' : ''
      return
    }
    if (!reduce) root.style.cursor = hit(m) !== null ? 'grab' : ''
  }
  function onClick(e: MouseEvent) {
    if (!editRef.current || !visible || !shown()) return
    if (onPhotoArea(local(e))) editRef.current.onPhoto()
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
  // skeleton shimmer dicabut begitu kartu pertama digambar
  wrapEl.dataset.ready = ''
  img.onload = () => draw()
  visible = shown()
  if (!reduce && visible) frame = requestAnimationFrame(loop)

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && wrapEl.offsetParent !== null
    if (visible && !sleeping) wake()
  })
  io.observe(wrapEl)
  // kotak berubah ukuran, atau posisi kolom di layar berubah: area tarik dihitung ulang
  const relayout = () => {
    resize()
    build()
    draw()
    if (!reduce) wake()
  }
  const ro = new ResizeObserver(relayout)
  ro.observe(el)
  ro.observe(wrapEl)
  window.addEventListener('resize', relayout)
  // tema berganti: gambar ulang dengan warna tema baru
  const mo = new MutationObserver(() => draw())
  mo.observe(root, { attributes: true, attributeFilter: ['class'] })
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('click', onClick)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)

  return {
    redraw: () => draw(),
    setPhoto: (src) => {
      if (img.src !== new URL(src, window.location.href).href) img.src = src
    },
    destroy: () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('click', onClick)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('resize', relayout)
      root.style.cursor = ''
    },
  }
}
