'use client'

import { FileSpreadsheet, Megaphone, SquareKanban, Users } from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import { isScrolling, onScrollEnd } from '@/lib/scroll-idle'
import { cn } from '@/lib/utils'

import type { GenericGlyph, SkillItem } from '../skill-items'

import {
  buildSprite,
  drawItem,
  type ItemGeometry,
  type ItemSprite,
  type Palette,
  measureItem,
  releaseSprites,
} from './globe-sprites'

// garis bola: ruas per lingkaran dan jumlah tingkat kedalaman untuk pengelompokan stroke
const RING_STEPS = 60
const DEPTH_BANDS = 6
const GENERIC_ICONS = {
  kanban: SquareKanban,
  users: Users,
  megaphone: Megaphone,
  sheet: FileSpreadsheet,
} satisfies Record<GenericGlyph, unknown>

// satu warna untuk semua kategori: biru situs (pilihan pemilik 2026-10-18, demo B7 dengan warna seragam)
const RING_COLOR = 'var(--note)'

type Vec = [number, number, number]

// sudut awal: sedikit miring agar kesan bola langsung terlihat
const START_YAW = 0.4
const START_PITCH = -0.25
// putaran otomatis per frame (radian) dan batas miring saat digeser
// jeda antarbingkai saat berputar otomatis (±30 fps)
const AUTO_FRAME_MS = 30
const AUTO_SPEED = 0.0028
const PITCH_LIMIT = 1.2
const FACE_PITCH = 0.75
// scroll lebih jauh dari ini (px) melepas logo terpilih
const SCROLL_RELEASE = 48
// geseran di bawah ini masih dianggap tekan, bukan memutar
const DRAG_THRESHOLD = 4
// nama skill hanya tampil di sisi depan (kedalaman 0 belakang .. 1 depan)
const LABEL_DEPTH = 0.6
// logo di sisi belakang, atau yang tertutup logo lain di depannya, terlalu kecil untuk ditekan
// (WCAG 2.5.8), jadi inert sampai berputar ke posisi yang lega. Panah kiri/kanan tetap menjangkau semua logo (diputar ke depan dulu) dan
// daftar lengkap skill tersedia untuk pembaca layar.
const BACK_DEPTH = 0.45
// ukuran target minimum WCAG 2.5.8 (px)
const MIN_TARGET = 24

type Rect = [left: number, top: number, right: number, bottom: number]
const overlaps = (a: Rect, b: Rect) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]

// titik merata di permukaan bola (spiral Fibonacci), digeser setengah langkah agar tidak ada logo
// tepat di kutub (bola akan terlihat dari atas saat logo itu diputar ke depan)
function spherePoints(n: number): Vec[] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - ((i + 0.5) / n) * 2
    const r = Math.sqrt(1 - y * y)
    return [Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]
  })
}

function rotate([x, y, z]: Vec, yaw: number, pitch: number): Vec {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp]
}

// hasil rotasi diproyeksikan dengan perspektif ringan; x dan y dalam satuan jari-jari bola
function project(p: Vec, yaw: number, pitch: number, scale = 1): Vec {
  const [x, y, z] = rotate(p, yaw, pitch)
  const persp = 1 / (1 - z * 0.28)
  return [x * scale * persp, y * scale * persp, z]
}

// sudut yang membuat titik p menghadap pengunjung; kemiringan dibatasi agar tetap tampak seperti bola
function facing([x, y, z]: Vec): [number, number] {
  const pitch = Math.atan2(y, Math.hypot(x, z))
  return [Math.atan2(-x, z), Math.max(-FACE_PITCH, Math.min(FACE_PITCH, pitch))]
}

// variabel CSS satu logo: posisi, skala, keburaman, dan tampil tidaknya nama
// makin banyak skill makin kecil logonya, agar bola tetap lega (penuh sampai 24 skill)
function densityScale(count: number) {
  return Math.min(1, Math.sqrt(24 / Math.max(1, count)))
}

function itemStyle(p: Vec, yaw: number, pitch: number, density: number) {
  const [x, y, z] = project(p, yaw, pitch)
  const depth = (z + 1) / 2
  return {
    '--x': x.toFixed(4),
    '--y': y.toFixed(4),
    '--s': (density * (0.5 + depth * 0.55)).toFixed(3),
    '--o': (0.18 + depth * 0.82).toFixed(3),
    '--lo': depth >= LABEL_DEPTH ? '1' : '0',
    back: depth < BACK_DEPTH,
    zIndex: Math.round(depth * 100),
  }
}

function Glyph({ item }: { item: SkillItem }) {
  if (item.glyph?.kind === 'image') {
    return (
      // logo asli WebP statis kecil (skill-logos.ts): tanpa optimasi next/image
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.glyph.src}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
        draggable={false}
        data-invert-dark={item.glyph.invertDark ? '' : undefined}
      />
    )
  }
  if (item.glyph?.kind === 'brand') {
    return (
      <svg viewBox={item.glyph.viewBox ?? '0 0 24 24'} fill="currentColor" aria-hidden="true">
        <path d={item.glyph.path} fillRule={item.glyph.evenOdd ? 'evenodd' : undefined} />
      </svg>
    )
  }
  if (item.glyph?.kind === 'generic') {
    const Icon = GENERIC_ICONS[item.glyph.name]
    return <Icon strokeWidth={2} aria-hidden="true" />
  }
  return (
    <span className="font-mono text-xs font-bold" aria-hidden="true">
      {item.label}
    </span>
  )
}

// Globe skill di beranda (DESIGN.md bagian 73, pilihan pemilik demo S4 + warna kategori S7): logo skill
// di permukaan bola bergaris lintang-bujur. Bola berputar pelan, bisa digeser (mouse atau jari ke
// samping), dan logo yang ditekan diputar ke depan lalu rinciannya tampil di bawah. Menu kategori
// meredupkan kategori lain. Logo adalah tombol toggle biasa (Enter/Spasi, panah kiri/kanan); hanya
// garis bola yang digambar di canvas. Posisi awal sudah dihitung di server, jadi tanpa JavaScript bola
// tetap tampil.
// Reduced-motion: tanpa putaran otomatis dan tanpa animasi saat berpindah logo.
export function SkillGlobe({
  items,
  categories,
  labels,
  className,
}: {
  items: SkillItem[]
  categories: string[]
  labels: {
    globe: string
    list: string
    categories: string
    category: string
    all: string
  }
  className?: string
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const points = useMemo(() => spherePoints(items.length), [items.length])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [category, setCategory] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const panelId = useId()
  // jembatan dari handler React ke loop animasi di effect
  const controls = useRef<{
    face: (index: number) => void
    home: () => void
    wake: () => void
  } | null>(null)
  const activeRef = useRef<number | null>(null)
  // salinan untuk loop animasi di effect
  const pointsRef = useRef(points)
  useEffect(() => {
    pointsRef.current = points
    controls.current?.wake()
  }, [points])
  useEffect(() => {
    activeRef.current = activeIndex
    controls.current?.wake()
  }, [activeIndex])
  // keadaan kategori (menonjol/redup) digambar canvas: gambar ulang juga saat bola diam (reduced-motion)
  useEffect(() => {
    controls.current?.wake()
  }, [category])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!stage || !canvas || !ctx) return
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
      }
      draw()
    }

    const resize = () => {
      const rect = stage.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // sama dengan nilai awal --r di globals.css (.globe-stage)
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

    const draw = () => {
      drawSphere()
      if (sizes.length !== pointsRef.current.length) measure()
      const density = densityScale(pointsRef.current.length)
      const styles = pointsRef.current.map((p) => itemStyle(p, yaw, pitch, density))
      // logo yang bisa ditekan: dari yang paling depan, logo yang menutupi logo lain menang
      const order = styles
        .map((style, i) => ({ i, rank: i === activeRef.current ? Infinity : style.zIndex }))
        .sort((a, b) => b.rank - a.rank)
      const placed: Rect[] = []
      // Tombol HTML (tak terlihat saat canvas menggambar logo) cukup dipindah tiap bingkai ke-4, kecuali
      // saat digeser/diputar ke logo dan untuk logo yang disorot, difokus, atau terpilih: posisi target
      // sentuh paling jauh tertinggal ±130 ms (beberapa piksel pada putaran pelan).
      const syncAll = !painted || drag !== null || target !== null || domTick++ % 4 === 0
      const focused = document.activeElement
      for (const { i } of order) {
        const el = itemRefs.current[i]
        const style = styles[i]
        if (!el || !style) continue
        const sync = syncAll || i === hovered || i === activeRef.current || el === focused
        // Tiap bingkai: transform ditulis langsung (bukan lewat --x/--y/--s di tombol) dan --o hanya di
        // lingkaran logo. Variabel CSS di tombol diwariskan ke seluruh isinya sehingga setiap bingkai
        // menghitung ulang gaya 31 logo beserta isinya (diukur 2026-10-20: ±25 ms per bingkai di HP
        // dengan CPU 4x lebih lambat). Nilai awal dari server tetap lewat variabel (globals.css).
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

    const shortest = (from: number, to: number) => {
      let d = to - from
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      return d
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
      draw()
      if (visible && moving) frame = requestAnimationFrame(loop)
    }
    // tidak pernah menjadwalkan bingkai setelah globe dibongkar (audit 2026-10-31, BUG-02)
    const wake = () => {
      if (!disposed && !frame && visible) frame = requestAnimationFrame(loop)
    }
    controls.current = {
      face: (index) => {
        const p = pointsRef.current[index]
        if (!p) return
        target = facing(p)
        homing = false
        velocity = 0
        wake()
      },
      home: () => {
        target = null
        homing = true
        wake()
      },
      wake,
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

    return () => {
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
      controls.current = null
    }
  }, [])

  function select(index: number) {
    activeRef.current = index
    setActiveIndex(index)
    controls.current?.face(index)
  }

  // lepas pilihan: bola kembali ke kemiringan awal lalu berputar lagi (revisi pemilik 2026-10-18)
  function release() {
    activeRef.current = null
    setActiveIndex(null)
    controls.current?.home()
  }

  // Selama ada logo terpilih: scroll, tekan di mana saja (selain logo lain dan panel rincian), atau Esc
  // melepas pilihan sehingga bola berputar lagi. Scroll kecil (mis. fokus Tab yang menggeser layar)
  // diabaikan.
  useEffect(() => {
    if (activeIndex === null) return
    const startY = window.scrollY
    const panel = document.getElementById(panelId)
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > SCROLL_RELEASE) release()
    }
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest('.globe-item') || (panel && target && panel.contains(target))) return
      release()
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') release()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [activeIndex, panelId])

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index - 1
    if (next === null) return
    event.preventDefault()
    const target = (next + items.length) % items.length
    const el = itemRefs.current[target]
    if (!el) return
    // logo tujuan bisa sedang di belakang (inert): pilih dan putar ke depan dulu, baru difokus
    select(target)
    el.inert = false
    el.focus()
  }

  // null = semua kategori
  function chooseCategory(next: number | null) {
    setCategory(next)
    setMenuOpen(false)
    release()
    if (next === null) return
    const first = items.findIndex((item) => item.categoryIndex === next)
    if (first >= 0) controls.current?.face(first)
  }

  // Menu kategori (pilihan pemilik dari 10 demo gaya tombol: C5 "menu tarik"): tutup saat menekan di
  // luar menu atau Esc (fokus kembali ke tombolnya)
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      filterRef.current?.querySelector<HTMLButtonElement>('.globe-filter-toggle')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const active = activeIndex === null ? null : items[activeIndex]
  // posisi awal (sama di server dan klien), selanjutnya diperbarui langsung oleh loop animasi
  const initial = points.map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- back hanya dipakai loop animasi
    const { back, ...style } = itemStyle(p, START_YAW, START_PITCH, densityScale(points.length))
    return style
  })

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div ref={stageRef} role="group" aria-label={labels.globe} className="globe-stage">
        <canvas ref={canvasRef} aria-hidden="true" className="globe-canvas" />
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            type="button"
            className="globe-item"
            data-active={i === activeIndex ? '' : undefined}
            data-dim={category !== null && item.categoryIndex !== category ? '' : undefined}
            data-hl={category !== null && item.categoryIndex === category ? '' : undefined}
            aria-pressed={i === activeIndex}
            aria-controls={panelId}
            // sebelum JavaScript menghitung tumpang-tindih, logo belum bisa dipakai: semua inert
            inert
            style={
              {
                ...initial[i],
                '--cat': RING_COLOR,
                '--logo': item.logoColor ?? 'currentColor',
              } as CSSProperties
            }
            // tekan ulang logo yang sedang terpilih: lepas, bola berputar lagi
            onClick={() => (i === activeIndex ? release() : select(i))}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            <span className="globe-logo">
              <Glyph item={item} />
            </span>
            <span className="globe-name" aria-hidden="true">
              {item.name}
            </span>
            <span className="sr-only">
              {item.name}, {item.category}
            </span>
          </button>
        ))}
      </div>

      {/* logo di sisi belakang inert, jadi daftar lengkap disediakan untuk pembaca layar */}
      <ul className="sr-only" aria-label={labels.list}>
        {items.map((item) => (
          <li key={item.id}>
            {item.name}, {item.category}
          </li>
        ))}
      </ul>

      {categories.length > 1 ? (
        <div ref={filterRef} className="globe-filter" data-open={menuOpen ? '' : undefined}>
          <button
            type="button"
            className="globe-filter-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="globe-filter-label">{labels.category}</span>
            {category === null ? labels.all : categories[category]}
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <div
            id={menuId}
            role="group"
            aria-label={labels.categories}
            className="globe-filter-menu"
          >
            {[null, ...categories.map((_, i) => i)].map((index) => (
              <button
                key={index ?? 'all'}
                type="button"
                aria-pressed={category === index}
                onClick={() => chooseCategory(index)}
              >
                {index === null ? labels.all : categories[index]}
                <span className="globe-filter-count">
                  {index === null
                    ? items.length
                    : items.filter((item) => item.categoryIndex === index).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* tinggi minimum memberi ruang menu kategori yang terbuka ke bawah, agar tidak melewati garis
          bagian berikutnya */}
      <div id={panelId} className="mt-6 min-h-36 text-center md:min-h-32">
        {active ? (
          <>
            <p className="font-display text-2xl font-bold uppercase sm:text-3xl">{active.name}</p>
            <p className="mt-1 font-mono text-label tracking-widest text-muted uppercase">
              {active.category}
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}
