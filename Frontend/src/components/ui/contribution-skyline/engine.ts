// Mesin kanvas grafik kontribusi: menata ukuran, menggambar grid 2D/3D, menjalankan morph,
// orbit, sorotan, dan tooltip, serta menangani tetikus, sentuhan, dan keyboard. Dibuat sekali per
// mount oleh index.tsx; semua nilai dari React dibaca lewat `cfg.current` agar tidak basi.

import type { Dispatch, SetStateAction } from 'react'

import type { Palette } from '@backend/lib/github-palette'

import { pointInQuad, quadPath, rgbString, toRGB } from './canvas'
import {
  barHeight,
  camera,
  type Cam,
  type Cell,
  type ContributionStats,
  dayMs,
  ELEV_3D,
  ELEV_RANGE,
  easeInOutCubic,
  lerp,
  luminance,
  mixRGB,
  NARROW_WIDTH,
  project,
  resolvePalette,
  type RGB,
  riseAt,
  smoothstep,
  YAW_3D,
  YAW_3D_NARROW,
  YAW_RANGE,
} from './model'

export type SkylineModel = {
  cells: Cell[]
  weeks: number
  max: number
  stats: ContributionStats
  months: { week: number; label: string }[]
}

/** Warna yang juga dipakai DOM: kotak legenda dan angka statistik. */
export type SkylineTheme = { dark: boolean; swatches: string[]; accent: string }

export type SkylineSettings = {
  model: SkylineModel
  duration: number
  heightScale: number
  orbit: boolean
  palette: Palette | undefined
  /** 0 = 2D, 1 = 3D */
  target: number
  setActive: (i: number) => void
  setTheme: Dispatch<SetStateAction<SkylineTheme>>
  setAnnounce: (text: string) => void
  describe: (i: number) => string
}

export type SkylineEngine = {
  /** Pindah ke tampilan `cfg.current.target` lalu lanjutkan animasi. */
  kick: () => void
  /** Data berubah: baca ulang sel, warna, dan ukuran. */
  load: () => void
  retheme: () => void
  /** Lebar tooltip (px), agar tooltip tetap di dalam kartu. */
  tipWidth: (w: number) => void
  destroy: () => void
}

const FG_FALLBACK: RGB = [23, 23, 23]
const BG_FALLBACK: RGB = [255, 255, 255]

export function createSkylineEngine({
  root,
  stage,
  canvas,
  tip,
  cfg,
  locale,
}: {
  root: HTMLElement
  stage: HTMLElement
  canvas: HTMLCanvasElement
  tip: HTMLElement
  cfg: { readonly current: SkylineSettings }
  locale: string
}): SkylineEngine | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const darkMq = window.matchMedia('(prefers-color-scheme: dark)')
  let reduced = reduceMq.matches

  // morph: t adalah waktu linear 0 (2D) -> 1 (3D); kamera memakai versi ease, batang bergelombang
  let t = 0
  let target = 0
  let entered = false
  // geseran orbit, mendekati tujuannya dengan halus
  let yaw = 0
  let elev = 0
  let baseYaw = YAW_3D
  let yawGoal = 0
  let elevGoal = 0
  // tata letak
  let W = 0
  let H2 = 0
  let H3 = 0
  let Hmax = 0
  let lastH = -1
  let dpr = 1
  let gutter = 30
  let labelW = 30
  let font = '10px sans-serif'
  // warna: [kosong, l1, l2, l3, l4] x rgb, mendekati tujuannya dengan halus
  const col = new Float32Array(15)
  const colGoal = new Float32Array(15)
  let colReady = false
  let fg: RGB = FG_FALLBACK
  let bg: RGB = BG_FALLBACK
  let isDark = false
  // sel
  let n = 0
  let weeks = 0
  let wk = new Float32Array(0)
  let dy = new Float32Array(0)
  let lv = new Uint8Array(0)
  let hgt = new Float32Array(0)
  let zs = new Float32Array(0)
  let hover = new Float32Array(0)
  let polys = new Float32Array(0)
  let faces = new Uint8Array(0)
  let order: number[] = []
  let months: { week: number; label: string }[] = []
  let weekdayRows: { day: number; label: string }[] = []
  // interaksi
  let hovered = -1
  let pinned = -1
  let activeIdx = -1
  let tipW = 0
  let raf = 0
  let last = 0

  const load = () => {
    const m = cfg.current.model
    n = m.cells.length
    weeks = m.weeks
    if (wk.length !== n) {
      wk = new Float32Array(n)
      dy = new Float32Array(n)
      lv = new Uint8Array(n)
      hgt = new Float32Array(n)
      zs = new Float32Array(n)
      hover = new Float32Array(n)
      polys = new Float32Array(n * 24)
      faces = new Uint8Array(n)
      order = Array.from({ length: n }, (_, i) => i)
    }
    for (let i = 0; i < n; i++) {
      const c = m.cells[i]
      wk[i] = c.week
      dy[i] = c.day
      lv[i] = c.level
      hgt[i] = barHeight(c.count, m.max, cfg.current.heightScale)
    }
    months = m.months
    const wf = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
    weekdayRows = []
    // nama hari hanya di baris Senin, Rabu, dan Jumat seperti GitHub
    for (let d = 0; d < 7 && d < n; d++) {
      const ms = dayMs(m.cells[d].date)
      const dow = new Date(ms).getUTCDay()
      if (dow === 1 || dow === 3 || dow === 5) weekdayRows.push({ day: d, label: wf.format(ms) })
    }
    if (hovered >= n) hovered = -1
    if (pinned >= n) pinned = -1
  }

  const retheme = () => {
    const cs = getComputedStyle(root)
    fg = toRGB(cs.color, FG_FALLBACK) ?? FG_FALLBACK
    const b = toRGB(cs.backgroundColor, null)
    bg = b ?? (luminance(fg) > 0.5 ? [10, 10, 10] : BG_FALLBACK)
    isDark = luminance(bg) < 0.45
    font = '400 10px ' + (cs.fontFamily || 'sans-serif')
    const pal = resolvePalette(cfg.current.palette, isDark)
    const empty = mixRGB(bg, fg, isDark ? 0.11 : 0.075)
    const all: RGB[] = [empty, ...pal.map((c) => toRGB(c, FG_FALLBACK) ?? FG_FALLBACK)]
    for (let k = 0; k < 5; k++) for (let ch = 0; ch < 3; ch++) colGoal[k * 3 + ch] = all[k][ch]
    if (!colReady || reduced) {
      col.set(colGoal)
      colReady = true
    }
    ctx.font = font
    labelW = Math.ceil(Math.max(20, ...weekdayRows.map((r) => ctx.measureText(r.label).width))) + 8
    const sw = all.map((c) => rgbString(c[0], c[1], c[2]))
    cfg.current.setTheme((prev) =>
      prev.dark === isDark && prev.swatches.join() === sw.join()
        ? prev
        : { dark: isDark, swatches: sw, accent: sw[4] },
    )
    kick()
  }

  // Jangkauan adegan di layar untuk kamera e, dengan tiap batang setinggi zs[i] (atau penuh).
  const extent = (cam: Cam, e: number, full: boolean) => {
    const w = lerp(0.78, 0.9, e)
    const off = (1 - w) / 2
    let minx = Infinity
    let maxx = -Infinity
    let miny = Infinity
    let maxy = -Infinity
    const add = (x: number, y: number, z: number) => {
      const p = project(cam, x, y, z)
      if (p[0] < minx) minx = p[0]
      if (p[0] > maxx) maxx = p[0]
      if (p[1] < miny) miny = p[1]
      if (p[1] > maxy) maxy = p[1]
    }
    for (let i = 0; i < n; i++) {
      const x0 = wk[i] + off
      const y0 = dy[i] + off
      const z = full ? hgt[i] * e : zs[i]
      add(x0, y0, z)
      add(x0 + w, y0, z)
      add(x0, y0 + w, z)
      add(x0 + w, y0 + w, 0)
      add(x0, y0 + w, 0)
      add(x0 + w, y0, 0)
    }
    // ruang untuk label bulan di tepi depan pada 3D
    add(0, 7 + 1.5 * e, 0)
    add(weeks, 7 + 1.5 * e, 0)
    return { minx, maxx, miny, maxy }
  }

  // Grafik selalu dipaskan selebar kotaknya (sel lebih kecil di HP), tanpa geser menyamping.
  const relayout = () => {
    const w = Math.round(stage.clientWidth)
    if (!w || !n) return
    W = w
    // kartu sempit memberikan kolom nama hari ke grid; barisnya terlalu rapat untuk dilabeli
    gutter = w < 520 ? 0 : labelW
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const b2 = extent(camera(0), 0, true)
    H2 = 20 + 4 + ((b2.maxy - b2.miny) / (b2.maxx - b2.minx)) * (W - gutter - 4)
    const narrow = w < NARROW_WIDTH
    baseYaw = narrow ? YAW_3D_NARROW : YAW_3D
    const b3 = extent(camera(1, baseYaw - YAW_3D), 1, true)
    const natural = ((b3.maxy - b3.miny) / (b3.maxx - b3.minx)) * (w - 40) + 40
    H3 = Math.max(Math.min(natural, w * (narrow ? 1.3 : 0.72), 620), Math.min(natural, 240))
    Hmax = Math.ceil(Math.max(H2, H3))
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(Hmax * dpr)
    canvas.style.width = W + 'px'
    canvas.style.height = Hmax + 'px'
    lastH = -1
    draw()
  }

  const draw = () => {
    if (!W || !n) return
    // skeleton shimmer dicabut begitu grafik pertama digambar
    if (!stage.dataset.ready) stage.dataset.ready = ''
    const e = easeInOutCubic(t)
    const cam = camera(e, baseYaw - YAW_3D + yaw, elev)
    const Hc = lerp(H2, H3, e)
    if (Math.abs(Hc - lastH) > 0.2) {
      stage.style.height = Hc.toFixed(1) + 'px'
      lastH = Hc
    }
    for (let i = 0; i < n; i++) zs[i] = riseAt(t, wk[i], weeks, dy[i]) * hgt[i]
    const b = extent(cam, e, false)
    const pad = lerp(2, 20, e)
    const left = pad + gutter * (1 - e)
    const top = pad + 20 * (1 - e)
    const aw = W - left - pad
    const ah = Hc - top - pad
    const bw = Math.max(1e-6, b.maxx - b.minx)
    const bh = Math.max(1e-6, b.maxy - b.miny)
    const s = Math.min(aw / bw, ah / bh)
    const ox = left + (aw - bw * s) / 2 - b.minx * s
    const oy = top + (ah - bh * s) / 2 - b.miny * s
    const { cs, sn, se, ce } = cam
    const px = (x: number, y: number) => ox + (x * cs - y * sn) * s
    const py = (x: number, y: number, z: number) => oy + ((x * sn + y * cs) * se - z * ce) * s

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, Hmax)

    // urut dari belakang ke depan agar batang depan menutupi yang di belakang
    order.sort(
      (a, c) => (wk[a] + 0.5) * sn + (dy[a] + 0.5) * cs - ((wk[c] + 0.5) * sn + (dy[c] + 0.5) * cs),
    )

    const w = lerp(0.78, 0.9, e)
    const off = (1 - w) / 2
    const radius = lerp(0.17, 0.03, e) * s
    const outline = (1 - e) * 0.07
    const lift = 0.7 * e

    for (let k = 0; k < n; k++) {
      const i = order[k]
      const x0 = wk[i] + off
      const y0 = dy[i] + off
      const x1 = x0 + w
      const y1 = y0 + w
      const z = zs[i] + hover[i] * lift
      const o = i * 24
      // atas
      polys[o] = px(x0, y0)
      polys[o + 1] = py(x0, y0, z)
      polys[o + 2] = px(x1, y0)
      polys[o + 3] = py(x1, y0, z)
      polys[o + 4] = px(x1, y1)
      polys[o + 5] = py(x1, y1, z)
      polys[o + 6] = px(x0, y1)
      polys[o + 7] = py(x0, y1, z)
      // sisi +y (kiri di layar)
      polys[o + 8] = px(x0, y1)
      polys[o + 9] = py(x0, y1, 0)
      polys[o + 10] = px(x1, y1)
      polys[o + 11] = py(x1, y1, 0)
      polys[o + 12] = polys[o + 4]
      polys[o + 13] = polys[o + 5]
      polys[o + 14] = polys[o + 6]
      polys[o + 15] = polys[o + 7]
      // sisi +x (kanan di layar)
      polys[o + 16] = px(x1, y0)
      polys[o + 17] = py(x1, y0, 0)
      polys[o + 18] = polys[o + 10]
      polys[o + 19] = polys[o + 11]
      polys[o + 20] = polys[o + 4]
      polys[o + 21] = polys[o + 5]
      polys[o + 22] = polys[o + 2]
      polys[o + 23] = polys[o + 3]

      // sisi hanya digambar bila cukup tinggi dan lebar untuk terlihat
      const tall = z * ce * s
      let f = 0
      if (tall > 0.35 && w * cs * s > 0.35) f |= 1
      if (tall > 0.35 && w * sn * s > 0.35) f |= 2
      faces[i] = f

      const L = lv[i] * 3
      let r = col[L]
      let g = col[L + 1]
      let bl = col[L + 2]
      const hv = hover[i]
      if (hv > 0.002) {
        const m = 0.16 * hv
        r += (fg[0] - r) * m
        g += (fg[1] - g) * m
        bl += (fg[2] - bl) * m
      }
      if (f & 1) {
        ctx.beginPath()
        quadPath(ctx, polys, o + 8, 0)
        ctx.fillStyle = rgbString(r * 0.84, g * 0.84, bl * 0.84)
        ctx.fill()
      }
      if (f & 2) {
        ctx.beginPath()
        quadPath(ctx, polys, o + 16, 0)
        ctx.fillStyle = rgbString(r * 0.68, g * 0.68, bl * 0.68)
        ctx.fill()
      }
      ctx.beginPath()
      quadPath(ctx, polys, o, radius)
      ctx.fillStyle = rgbString(r, g, bl)
      ctx.fill()
      if (outline > 0.004) {
        ctx.strokeStyle =
          'rgba(' + fg[0] + ',' + fg[1] + ',' + fg[2] + ',' + outline.toFixed(3) + ')'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      if (hv > 0.02) {
        ctx.strokeStyle =
          'rgba(' + fg[0] + ',' + fg[1] + ',' + fg[2] + ',' + (0.85 * hv).toFixed(3) + ')'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    // Label: di atas dan kiri pada 2D, di tepi depan pada 3D. Memudar, tidak muncul tiba-tiba.
    const muted = mixRGB(bg, fg, 0.55)
    const mutedRgba = (a: number) =>
      'rgba(' +
      Math.round(muted[0]) +
      ',' +
      Math.round(muted[1]) +
      ',' +
      Math.round(muted[2]) +
      ',' +
      a.toFixed(3) +
      ')'
    ctx.font = font
    const a2 = 1 - smoothstep(0, 0.4, e)
    const a3 = smoothstep(0.62, 1, e)
    if (a2 > 0.004) {
      ctx.fillStyle = mutedRgba(a2)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      let edge = -Infinity
      for (const m of months) {
        const x = px(m.week + off, -0.3)
        const tw = ctx.measureText(m.label).width
        if (x < edge || x + tw > W) continue
        ctx.fillText(m.label, x, py(m.week + off, -0.3, 0) - 3)
        edge = x + tw + 6
      }
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      if (gutter > 0)
        for (const r of weekdayRows)
          ctx.fillText(r.label, px(0, r.day + 0.5) - 6, py(0, r.day + 0.5, 0))
    }
    if (a3 > 0.004) {
      ctx.fillStyle = mutedRgba(a3)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      let edge = -Infinity
      for (const m of months) {
        const x = px(m.week + 0.5, 7.3)
        if (x < edge || x + ctx.measureText(m.label).width > W) continue
        ctx.fillText(m.label, x, py(m.week + 0.5, 7.3, 0) + 2)
        edge = x + ctx.measureText(m.label).width + 10
      }
    }

    // Tooltip mengikuti sel aktif selama morph dan orbit, tetap di dalam kartu.
    if (activeIdx >= 0 && activeIdx < n) {
      const i = activeIdx
      const z = zs[i] + hover[i] * lift
      const tx = px(wk[i] + 0.5, dy[i] + 0.5)
      const ty = Math.min(
        py(wk[i] + off, dy[i] + off, z),
        py(wk[i] + off + w, dy[i] + off, z),
        py(wk[i] + off, dy[i] + off + w, z),
      )
      const half = tipW / 2
      const cx = Math.min(W - half - 2, Math.max(half + 2, tx))
      tip.style.transform =
        'translate(' +
        (cx - half).toFixed(1) +
        'px,' +
        (ty - 8).toFixed(1) +
        'px) translateY(-100%)'
      tip.style.setProperty('--arrow', (tx - cx + half).toFixed(1) + 'px')
    }
  }

  // Satu langkah animasi: morph, orbit, warna, dan sorotan mendekati tujuannya; berhenti sendiri
  // saat semuanya diam.
  const tick = (now: number) => {
    raf = 0
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
    last = now
    let moving = false

    if (t !== target) {
      const step = reduced ? 1 : (dt * 1000) / Math.max(1, cfg.current.duration)
      t = target > t ? Math.min(target, t + step) : Math.max(target, t - step)
      moving = true
    }

    const ko = reduced ? 1 : 1 - Math.exp(-dt * 12)
    yaw += (yawGoal - yaw) * ko
    elev += (elevGoal - elev) * ko
    if (Math.abs(yawGoal - yaw) > 1e-4 || Math.abs(elevGoal - elev) > 1e-4) moving = true
    else {
      yaw = yawGoal
      elev = elevGoal
    }

    const kc = reduced ? 1 : 1 - Math.exp(-dt * 7)
    for (let k = 0; k < 15; k++) {
      const d = colGoal[k] - col[k]
      if (Math.abs(d) > 0.4) {
        col[k] += d * kc
        moving = true
      } else col[k] = colGoal[k]
    }

    const kh = reduced ? 1 : 1 - Math.exp(-dt * 16)
    for (let i = 0; i < n; i++) {
      const hg = i === activeIdx ? 1 : 0
      const h = hover[i]
      if (h !== hg) {
        hover[i] = Math.abs(hg - h) < 0.003 ? hg : h + (hg - h) * kh
        moving = true
      }
    }

    draw()
    if (moving) raf = requestAnimationFrame(tick)
  }

  const kick = () => {
    if (raf) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  // Hari aktif adalah yang disorot kursor, selain itu yang disematkan (ketuk, klik, keyboard).
  const refreshActive = () => {
    const next = hovered >= 0 ? hovered : pinned
    if (next === activeIdx) return
    activeIdx = next
    cfg.current.setActive(next)
    kick()
  }

  // Sel di bawah titik (x, y), diperiksa dari yang paling depan.
  const hit = (x: number, y: number): number => {
    for (let k = n - 1; k >= 0; k--) {
      const i = order[k]
      const o = i * 24
      if (pointInQuad(polys, o, x, y)) return i
      if (faces[i] & 1 && pointInQuad(polys, o + 8, x, y)) return i
      if (faces[i] & 2 && pointInQuad(polys, o + 16, x, y)) return i
    }
    return -1
  }

  const local = (ev: PointerEvent | MouseEvent) => {
    const r = canvas.getBoundingClientRect()
    // pratinjau admin memperkecil halaman lewat transform (SiteFrame): posisi tetikus diubah ke
    // satuan tata letak supaya kotak yang ditunjuk sama dengan yang disorot; di situs skalanya 1
    const k = canvas.offsetWidth > 0 ? r.width / canvas.offsetWidth : 1
    const scale = Math.abs(k - 1) < 0.02 ? 1 : k
    return [(ev.clientX - r.left) / scale, (ev.clientY - r.top) / scale] as const
  }

  let drag: {
    id: number
    x: number
    y: number
    yaw: number
    elev: number
    moved: boolean
    orbit: boolean
    mouse: boolean
  } | null = null

  const onDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return
    const can = cfg.current.orbit && target === 1
    drag = {
      id: ev.pointerId,
      x: ev.clientX,
      y: ev.clientY,
      yaw: yawGoal,
      elev: elevGoal,
      moved: false,
      orbit: can,
      mouse: ev.pointerType === 'mouse',
    }
    if (can) {
      try {
        canvas.setPointerCapture(ev.pointerId)
      } catch {
        // pointer capture hanya pelengkap
      }
    }
  }

  const onMove = (ev: PointerEvent) => {
    if (drag && drag.orbit && ev.pointerId === drag.id) {
      const dx = ev.clientX - drag.x
      const dyy = ev.clientY - drag.y
      if (drag.moved || Math.hypot(dx, dyy) > 4) {
        drag.moved = true
        yawGoal = Math.min(
          YAW_RANGE[1] - baseYaw,
          Math.max(YAW_RANGE[0] - baseYaw, drag.yaw + dx * 0.006),
        )
        // elevasi hanya untuk tetikus; di layar sentuh geser vertikal tetap menggulir halaman
        if (drag.mouse)
          elevGoal = Math.min(
            ELEV_RANGE[1] - ELEV_3D,
            Math.max(ELEV_RANGE[0] - ELEV_3D, drag.elev + dyy * 0.004),
          )
        canvas.style.cursor = 'grabbing'
        hovered = -1
        refreshActive()
        kick()
        return
      }
    }
    if (ev.pointerType !== 'mouse') return
    const [x, y] = local(ev)
    const i = hit(x, y)
    if (i !== hovered) {
      hovered = i
      refreshActive()
    }
    canvas.style.cursor =
      cfg.current.orbit && target === 1 ? 'grab' : i >= 0 ? 'pointer' : 'default'
  }

  const onUp = (ev: PointerEvent) => {
    if (!drag || ev.pointerId !== drag.id) return
    const wasMoved = drag.moved
    drag = null
    if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId)
    canvas.style.cursor = cfg.current.orbit && target === 1 ? 'grab' : 'default'
    if (wasMoved) return
    const [x, y] = local(ev)
    const i = hit(x, y)
    pinned = i === pinned ? -1 : i
    if (ev.pointerType !== 'mouse') hovered = -1
    refreshActive()
  }

  const onCancel = () => {
    drag = null
  }

  const onLeave = () => {
    if (drag) return
    hovered = -1
    refreshActive()
  }

  // klik dua kali mengembalikan sudut orbit
  const onDbl = () => {
    yawGoal = 0
    elevGoal = 0
    kick()
  }

  // panah kiri/kanan = minggu, atas/bawah = hari, Home/End = ujung, Escape = lepas
  const onKey = (ev: KeyboardEvent) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape']
    if (!keys.includes(ev.key) || !n) return
    ev.preventDefault()
    if (ev.key === 'Escape') {
      pinned = -1
      hovered = -1
      refreshActive()
      return
    }
    let i = pinned >= 0 ? pinned : activeIdx >= 0 ? activeIdx : n - 1
    if (pinned >= 0 || activeIdx >= 0) {
      if (ev.key === 'ArrowLeft') i -= 7
      if (ev.key === 'ArrowRight') i += 7
      if (ev.key === 'ArrowUp') i -= 1
      if (ev.key === 'ArrowDown') i += 1
      if (ev.key === 'Home') i = 0
      if (ev.key === 'End') i = n - 1
    }
    i = Math.max(0, Math.min(n - 1, i))
    pinned = i
    hovered = -1
    refreshActive()
    cfg.current.setAnnounce(cfg.current.describe(i))
  }

  const onBlur = () => {
    pinned = -1
    refreshActive()
  }

  const setTarget = () => {
    const goal = cfg.current.target
    if (!entered || goal === target) return
    target = goal
    if (goal === 0) {
      yawGoal = 0
      elevGoal = 0
    }
    canvas.style.cursor = cfg.current.orbit && target === 1 ? 'grab' : 'default'
    kick()
  }

  load()
  retheme()
  relayout()

  // Tampilan 3D naik dari tampilan datar saat pertama kali terlihat.
  const enter = () => {
    if (entered) return
    entered = true
    if (reduced) t = cfg.current.target
    setTarget()
  }
  let io: IntersectionObserver | null = null
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          enter()
          io?.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(stage)
  } else enter()

  let lastCw = Math.round(stage.clientWidth)
  const ro = new ResizeObserver(() => {
    const cw = Math.round(stage.clientWidth)
    if (cw !== lastCw || cw !== W) {
      lastCw = cw
      relayout()
    }
  })
  ro.observe(stage)
  // pengaman: tanpa data atau lebar, shimmer tidak boleh menempel selamanya
  const readyTimer = window.setTimeout(() => {
    stage.dataset.ready = ''
  }, 4000)

  // next-themes mengganti kelas .dark di <html>
  const mo = new MutationObserver(retheme)
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  })
  const onReduce = () => {
    reduced = reduceMq.matches
    kick()
  }
  reduceMq.addEventListener('change', onReduce)
  darkMq.addEventListener('change', retheme)

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onCancel)
  canvas.addEventListener('pointerleave', onLeave)
  canvas.addEventListener('dblclick', onDbl)
  canvas.addEventListener('keydown', onKey)
  canvas.addEventListener('blur', onBlur)

  return {
    kick: () => {
      setTarget()
      kick()
    },
    load: () => {
      load()
      retheme()
      relayout()
    },
    retheme,
    tipWidth: (w: number) => {
      tipW = w
      draw()
    },
    destroy: () => {
      if (raf) cancelAnimationFrame(raf)
      io?.disconnect()
      window.clearTimeout(readyTimer)
      ro.disconnect()
      mo.disconnect()
      reduceMq.removeEventListener('change', onReduce)
      darkMq.removeEventListener('change', retheme)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('dblclick', onDbl)
      canvas.removeEventListener('keydown', onKey)
      canvas.removeEventListener('blur', onBlur)
    },
  }
}
