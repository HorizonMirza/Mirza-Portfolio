// Mesin animasi globe skill: menggambar garis bola dan logo di kanvas, memutar bola (otomatis,
// diseret, atau menghadap logo terpilih), memindah tombol HTML ke posisi logonya, dan menandai logo
// yang terlalu kecil atau tertutup sebagai inert. Dibuat sekali per mount oleh index.tsx.

import type { RefObject } from 'react'

import { isScrolling, onScrollEnd } from '@/lib/scroll-idle'

import {
  AUTO_FRAME_MS,
  AUTO_SPEED,
  densityScale,
  DEPTH_BANDS,
  DRAG_THRESHOLD,
  facing,
  itemStyle,
  MIN_TARGET,
  overlaps,
  PITCH_LIMIT,
  project,
  type Rect,
  RING_STEPS,
  shortest,
  START_PITCH,
  START_YAW,
  type Vec,
} from './math'
import {
  buildSprite,
  drawItem,
  type ItemGeometry,
  type ItemSprite,
  measureItem,
  type Palette,
  releaseSprites,
} from './sprites'

export type GlobeEngine = {
  /** Putar bola sampai logo `index` menghadap pengunjung. */
  face: (index: number) => void
  /** Lepas pilihan: kemiringan kembali ke awal lalu berputar lagi. */
  home: () => void
  /** Jadwalkan bingkai berikutnya (setelah data atau keadaan berubah). */
  wake: () => void
  destroy: () => void
}

export function createGlobeEngine({
  stage,
  canvas,
  itemRefs,
  pointsRef,
  activeRef,
}: {
  stage: HTMLDivElement
  canvas: HTMLCanvasElement
  itemRefs: RefObject<(HTMLButtonElement | null)[]>
  pointsRef: RefObject<Vec[]>
  activeRef: RefObject<number | null>
}): GlobeEngine | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  let yaw = START_YAW
  let pitch = START_PITCH
  let velocity = reduce.matches ? 0 : AUTO_SPEED
  let target: [number, number] | null = null
  let homing = false
  let width = 0
  let height = 0
  let radius = 0
  let lineColor = ''
  let frame = 0
  let visible = false
  let drag: { x: number; y: number; id: number; moved: boolean } | null = null

  // tampilan logo digambar di canvas (globe-sprites.ts) setelah semua sprite siap; sebelum itu (dan
  // tanpa JavaScript) logo HTML yang terlihat
  let disposed = false
  let painted = false
  let geoms: ItemGeometry[] = []
  let sprites: (ItemSprite | undefined)[] = []
  let palette: Palette = { cat: '', text: '', muted: '', font: '' }
  const labelAlpha: number[] = []
  let hovered = -1
  let domTick = 0
  let spriteRound = 0

  const readColor = () => {
    lineColor = getComputedStyle(canvas).color
    const css = getComputedStyle(stage)
    const name = stage.querySelector<HTMLElement>('.globe-name')
    const ns = name ? getComputedStyle(name) : null
    palette = {
      cat: lineColor,
      text: css.getPropertyValue('--text').trim() || css.color,
      muted: css.getPropertyValue('--text-muted').trim() || css.color,
      font: ns ? `${ns.fontWeight} ${ns.fontSize} ${ns.fontFamily}` : '12px monospace',
    }
  }
  const buildSprites = async () => {
    const round = ++spriteRound
    const dark = document.documentElement.classList.contains('dark')
    const els = itemRefs.current
    const next = await Promise.all(
      els.map((el, i) => (el ? buildSprite(el, geoms[i]?.inner ?? 32, dark) : undefined)),
    )
    if (disposed || round !== spriteRound) {
      releaseSprites(next)
      return
    }
    releaseSprites(sprites)
    sprites = next
    if (!painted) {
      painted = true
      stage.dataset.canvas = ''
      stage.dataset.ready = ''
    }
    draw()
  }

  const resize = () => {
    const rect = stage.getBoundingClientRect()
    // pratinjau admin diperkecil lewat transform (SiteFrame): ukuran tata letak dipakai agar
    // kanvas dan tombol logo tetap sejajar; di situs publik skalanya 1
    const k = stage.offsetWidth > 0 ? rect.width / stage.offsetWidth : 1
    const scale = Math.abs(k - 1) < 0.02 ? 1 : k
    width = rect.width / scale
    height = rect.height / scale
    const dpr = Math.min(1.5, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // sama dengan nilai awal --r di styles/site/skill-globe.css (.globe-stage)
    const wide = window.matchMedia('(min-width: 1024px)').matches
    radius = wide
      ? Math.min(width * 0.4, height * 0.42, 280)
      : Math.min(width * 0.4, height * 0.4, 240)
    stage.style.setProperty('--r', `${radius}px`)
    readColor()
    sizes = []
  }

  // garis lintang dan bujur; sisi belakang lebih pudar
  const drawSphere = () => {
    ctx.clearRect(0, 0, width, height)
    const cx = width / 2
    const cy = height / 2
    const r = radius * 0.98
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1
    // Ruas garis dikelompokkan per tingkat kedalaman (DEPTH_BANDS), lalu tiap kelompok digambar dengan
    // satu stroke: ±10 panggilan gambar per bingkai, bukan ±800 (penyebab lag, laporan pemilik 2026-10-20)
    const bands: Path2D[][] = [[], []]
    const ring = (point: (a: number) => Vec, set: number) => {
      let prev: Vec | null = null
      for (let k = 0; k <= RING_STEPS; k++) {
        const q = project(point((k / RING_STEPS) * Math.PI * 2), yaw, pitch)
        if (prev) {
          const depth = ((prev[2] + q[2]) / 2 + 1) / 2
          const band = Math.min(DEPTH_BANDS - 1, Math.floor(depth * DEPTH_BANDS))
          const path = (bands[set]![band] ??= new Path2D())
          path.moveTo(cx + prev[0] * r, cy + prev[1] * r)
          path.lineTo(cx + q[0] * r, cy + q[1] * r)
        }
        prev = q
      }
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const la = (lat * Math.PI) / 180
      ring((a) => [Math.cos(a) * Math.cos(la), Math.sin(la), Math.sin(a) * Math.cos(la)], 0)
    }
    for (let lon = 0; lon < 180; lon += 30) {
      const lo = (lon * Math.PI) / 180
      ring((a) => [Math.cos(a) * Math.cos(lo), Math.sin(a), Math.cos(a) * Math.sin(lo)], 1)
    }
    // sisi belakang lebih pudar: lintang 0,28 dan bujur 0,24 dikali 0,35–1,25 menurut kedalaman
    bands.forEach((set, k) => {
      set.forEach((path, band) => {
        if (!path) return
        ctx.globalAlpha = (k === 0 ? 0.28 : 0.24) * (0.35 + ((band + 0.5) / DEPTH_BANDS) * 0.9)
        ctx.stroke(path)
      })
    })
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // ukuran logo tanpa transform (offsetWidth/Height), dibaca sekali agar loop tidak memicu layout
  let sizes: [number, number][] = []
  const measure = () => {
    sizes = itemRefs.current.map((el) => (el ? [el.offsetWidth, el.offsetHeight] : [0, 0]))
    geoms = itemRefs.current.map((el) =>
      el
        ? measureItem(el, ctx)
        : {
            bw: 0,
            bh: 0,
            lx: 0,
            ly: 0,
            ld: 0,
            inner: 0,
            nx: 0,
            ny: 0,
            nw: 0,
            lines: [],
            lineHeight: 0,
          },
    )
    void buildSprites()
  }

  // full: semua tombol HTML dipindah ke posisi logonya. Loop animasi hanya mengirim false selama bola
  // masih bergerak; pemanggil lain (hover, resize, tema) dan bingkai terakhir sebelum bola diam selalu
  // sinkron penuh, agar target klik tidak tertinggal di posisi lama (klik hilang, CI #273).
  const draw = (full = true) => {
    drawSphere()
    if (sizes.length !== pointsRef.current.length) measure()
    const density = densityScale(pointsRef.current.length)
    const styles = pointsRef.current.map((p) => itemStyle(p, yaw, pitch, density))
    // logo yang bisa ditekan: dari yang paling depan, logo yang menutupi logo lain menang
    const order = styles
      .map((style, i) => ({ i, rank: i === activeRef.current ? Infinity : style.zIndex }))
      .sort((a, b) => b.rank - a.rank)
    const placed: Rect[] = []
    // Tombol HTML (tak terlihat saat canvas menggambar logo) cukup dipindah tiap bingkai ke-4 selama
    // bola bergerak, kecuali saat digeser/diputar ke logo dan untuk logo yang disorot, difokus, atau
    // terpilih: posisi target sentuh paling jauh tertinggal ±130 ms (beberapa piksel pada putaran
    // pelan). Begitu bola diam semuanya disinkronkan (draw(true)).
    const syncAll = full || !painted || drag !== null || target !== null || domTick++ % 4 === 0
    const focused = document.activeElement
    for (const { i } of order) {
      const el = itemRefs.current[i]
      const style = styles[i]
      if (!el || !style) continue
      const sync = syncAll || i === hovered || i === activeRef.current || el === focused
      // Tiap bingkai: transform ditulis langsung (bukan lewat --x/--y/--s di tombol) dan --o hanya di
      // lingkaran logo. Variabel CSS di tombol diwariskan ke seluruh isinya sehingga setiap bingkai
      // menghitung ulang gaya 31 logo beserta isinya (diukur 2026-10-20: ±25 ms per bingkai di HP
      // dengan CPU 4x lebih lambat). Nilai awal dari server tetap lewat variabel (styles/site/skill-globe.css).
      const scale = Number(style['--s'])
      const dx = Number(style['--x']) * radius
      const dy = Number(style['--y']) * radius
      if (sync) {
        el.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${style['--s']})`
        const z = String(style.zIndex + (i === activeRef.current ? 200 : 0))
        if (el.style.zIndex !== z) el.style.zIndex = z
      }
      if (!painted) {
        const logo = el.querySelector<HTMLElement>('.globe-logo')
        logo?.style.setProperty('--o', style['--o'])
        const name = el.querySelector<HTMLElement>('.globe-name')
        if (name && name.style.getPropertyValue('--lo') !== style['--lo']) {
          name.style.setProperty('--lo', style['--lo'])
        }
      }
      const [baseW, baseH] = sizes[i] ?? [0, 0]
      const w = baseW * scale
      const h = baseH * scale
      const cx = width / 2 + dx
      const cy = height / 2 + dy
      const rect: Rect = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
      const usable =
        i === activeRef.current ||
        (!style.back &&
          w >= MIN_TARGET &&
          h >= MIN_TARGET &&
          !placed.some((other) => overlaps(rect, other)))
      // ditulis hanya bila berubah: mengubah inert memicu hitung ulang pohon aksesibilitas
      if (el.inert === usable) el.inert = !usable
      if (usable) placed.push(rect)
    }
    if (!painted) return
    // logo dari belakang ke depan, nama memudar 0,2 dtk seperti transisi CSS --lo
    for (let k = order.length - 1; k >= 0; k--) {
      const i = order[k]!.i
      const style = styles[i]
      const g = geoms[i]
      const el = itemRefs.current[i]
      if (!style || !g || !el) continue
      const want = style['--lo'] === '1' ? 1 : 0
      const was = labelAlpha[i] ?? want
      labelAlpha[i] = Math.abs(want - was) < 0.02 ? want : was + (want - was) * 0.25
      drawItem(
        ctx,
        g,
        sprites[i],
        {
          cx: width / 2 + Number(style['--x']) * radius,
          cy: height / 2 + Number(style['--y']) * radius,
          scale: Number(style['--s']),
          opacity: Number(style['--o']),
          label: labelAlpha[i]!,
          active: i === activeRef.current,
          hl: el.dataset.hl !== undefined,
          dim: el.dataset.dim !== undefined,
          hover: i === hovered,
        },
        palette,
      )
    }
  }

  // true selama masih ada gerakan, sehingga loop bisa berhenti saat diam (reduced-motion)
  const step = () => {
    if (target) {
      const dy = shortest(yaw, target[0])
      const dp = target[1] - pitch
      const ease = reduce.matches ? 1 : 0.12
      yaw += dy * ease
      pitch += dp * ease
      if (Math.abs(dy) < 0.002 && Math.abs(dp) < 0.002) target = null
      return true
    }
    if (drag) return false
    // setelah pilihan lepas: kemiringan kembali pelan ke posisi awal
    if (homing) {
      const dp = START_PITCH - pitch
      pitch += reduce.matches ? dp : dp * 0.06
      if (Math.abs(dp) < 0.002) {
        pitch = START_PITCH
        homing = false
      }
    }
    const auto = reduce.matches || activeRef.current !== null ? 0 : AUTO_SPEED
    velocity += (auto - velocity) * 0.03
    yaw += velocity
    return Math.abs(velocity) > 0.0001 || auto > 0 || homing
  }

  // Putaran otomatis cukup 30 fps (pelan, tetap halus); seret dan arah ke logo tetap tiap bingkai.
  // Selama halaman digulir loop berhenti dan lanjut setelahnya (laporan lag pemilik 2026-10-20).
  let lastDraw = 0
  let cancelResume = () => {}
  const loop = (time: number) => {
    frame = 0
    if (disposed) return
    if (!drag && !target && isScrolling()) {
      cancelResume()
      cancelResume = onScrollEnd(wake)
      return
    }
    if (!drag && !target && time - lastDraw < AUTO_FRAME_MS) {
      if (visible) frame = requestAnimationFrame(loop)
      return
    }
    // langkah fisika tetap per 1/60 detik, jadi kecepatan putar sama walau digambar 30 fps
    const steps = Math.min(4, Math.max(1, Math.round((time - lastDraw) / (1000 / 60))))
    lastDraw = time
    let moving = false
    for (let k = 0; k < steps; k++) moving = step() || moving
    draw(!moving)
    // tanda bola diam (tidak berputar ke logo, tidak kembali ke awal, tidak diseret), dipakai tes E2E
    // agar tidak mengklik logo yang masih bergerak (CI #273); ditulis hanya bila berubah
    const idle = !moving && !drag
    if (stage.hasAttribute('data-idle') !== idle) stage.toggleAttribute('data-idle', idle)
    if (visible && moving) frame = requestAnimationFrame(loop)
  }
  // tidak pernah menjadwalkan bingkai setelah globe dibongkar (audit 2026-10-31, BUG-02)
  const wake = () => {
    if (!disposed && !frame && visible) frame = requestAnimationFrame(loop)
  }

  const onDown = (e: globalThis.PointerEvent) => {
    if (e.button !== 0) return
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false }
  }
  const onMove = (e: globalThis.PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return
    // tanpa tombol ditekan bukan geser: pointerup yang terlewat (mis. di WebKit) tidak boleh membuat
    // gerakan mouse biasa menangkap pointer dan menelan klik berikutnya
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      drag = null
      delete stage.dataset.dragging
      return
    }
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return
      // mulai memutar: tangkap pointer agar klik di logo tidak terpicu setelah digeser
      drag.moved = true
      stage.setPointerCapture(e.pointerId)
      stage.dataset.dragging = ''
      target = null
      homing = false
    }
    drag.x = e.clientX
    drag.y = e.clientY
    velocity = dx * 0.006
    yaw += velocity
    // di layar sentuh geser atas-bawah dipakai untuk scroll halaman (touch-action: pan-y)
    if (e.pointerType !== 'touch') {
      pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch - dy * 0.006))
    }
    draw()
  }
  const onUp = () => {
    if (!drag) return
    drag = null
    delete stage.dataset.dragging
    // reduced-motion: bola berhenti begitu dilepas, tanpa meluncur
    if (reduce.matches) velocity = 0
    wake()
  }
  stage.addEventListener('pointerdown', onDown)
  stage.addEventListener('pointermove', onMove)
  stage.addEventListener('pointerup', onUp)
  stage.addEventListener('pointercancel', onUp)

  resize()
  draw()
  // skeleton shimmer dicabut saat logo pertama selesai digambar; pengaman bila sprite gagal dibuat
  const readyTimer = window.setTimeout(() => {
    stage.dataset.ready = ''
  }, 4000)
  // lebar nama berubah setelah font termuat
  void document.fonts?.ready.then(() => {
    if (disposed) return
    sizes = []
    draw()
  })
  const resizeObserver = new ResizeObserver(() => {
    resize()
    draw()
  })
  resizeObserver.observe(stage)
  // berhenti menggambar saat bagian ini di luar layar
  const visibility = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting)
    if (visible) wake()
    else if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  })
  visibility.observe(stage)
  // ganti tema: warna garis dibaca ulang
  const themeObserver = new MutationObserver(() => {
    readColor()
    draw()
    // logo satu warna dan logo hitam yang dibalik bergantung pada tema
    if (painted) void buildSprites()
  })
  // logo disorot (mouse): tampilannya digambar canvas, jadi indeksnya dicatat di sini
  const onOver = (event: PointerEvent) => {
    const el = (event.target as Element | null)?.closest('.globe-item')
    const next = el ? itemRefs.current.indexOf(el as HTMLButtonElement) : -1
    if (next === hovered) return
    hovered = next
    draw()
  }
  const onLeaveStage = () => {
    if (hovered === -1) return
    hovered = -1
    draw()
  }
  stage.addEventListener('pointerover', onOver)
  stage.addEventListener('pointerleave', onLeaveStage)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  const onMotion = () => {
    velocity = 0
    wake()
  }
  reduce.addEventListener('change', onMotion)

  return {
    face: (index) => {
      const p = pointsRef.current[index]
      if (!p) return
      target = facing(p)
      homing = false
      velocity = 0
      stage.removeAttribute('data-idle')
      wake()
    },
    home: () => {
      target = null
      homing = true
      stage.removeAttribute('data-idle')
      wake()
    },
    wake,
    destroy: () => {
      window.clearTimeout(readyTimer)
      disposed = true
      cancelResume()
      cancelAnimationFrame(frame)
      releaseSprites(sprites)
      sprites = []
      resizeObserver.disconnect()
      visibility.disconnect()
      themeObserver.disconnect()
      reduce.removeEventListener('change', onMotion)
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
      stage.removeEventListener('pointerover', onOver)
      stage.removeEventListener('pointerleave', onLeaveStage)
    },
  }
}
