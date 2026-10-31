// Gambar logo globe skill di canvas (permintaan pemilik 2026-10-21: globe lag di HP). Tiap bingkai
// putaran, 31 tombol logo HTML dulu dihitung ulang gayanya (±42 ms per bingkai di HP dengan CPU 6x
// lebih lambat, bola ±12 fps). Kini tampilan logo digambar di canvas yang sama dengan garis bola;
// tombol HTML tetap ada (tak terlihat) untuk sentuhan, keyboard, dan pembaca layar, dan posisinya
// cukup diperbarui beberapa kali per detik.
// Ukuran dan jarak diambil dari tata letak tombol HTML (diukur sekali), warna dari token tema, dan
// keadaan (terpilih, kategori menonjol/redup, disorot) sama dengan aturan .globe-* di globals.css.

export type ItemGeometry = {
  // ukuran tombol tanpa transform
  bw: number
  bh: number
  // pusat dan diameter lingkaran logo, relatif ke pojok kiri atas tombol
  lx: number
  ly: number
  ld: number
  // kotak isi logo (diameter dikurangi padding)
  inner: number
  // kotak nama
  nx: number
  ny: number
  nw: number
  lines: string[]
  lineHeight: number
}

// ImageBitmap: tinggal di GPU, jadi digambar tiap bingkai tanpa diunggah ulang (canvas yang pernah dibaca
// pikselnya pindah ke memori CPU dan harus diunggah setiap kali digambar)
export type ItemSprite = { normal: CanvasImageSource; gray: CanvasImageSource }

// Lepas memori GPU sprite yang tidak dipakai lagi (ganti tema membuat set baru, audit 2026-10-31
// EFF-03). Kanvas cadangan (tanpa createImageBitmap) cukup dibiarkan ke pembersih memori.
export function releaseSprites(list: readonly (ItemSprite | undefined)[]) {
  if (typeof ImageBitmap === 'undefined') return
  for (const sprite of list) {
    if (!sprite) continue
    for (const image of [sprite.normal, sprite.gray]) {
      if (image instanceof ImageBitmap) image.close()
    }
  }
}

export type ItemState = {
  cx: number
  cy: number
  scale: number
  opacity: number
  label: number
  active: boolean
  hl: boolean
  dim: boolean
  hover: boolean
}

export type Palette = {
  cat: string
  text: string
  muted: string
  font: string
}

const SPRITE_SCALE = 2.5

// warna CSS apa pun -> rgba dengan alfa baru (melalui canvas agar semua format warna didukung)
const probe =
  typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
const alphaCache = new Map<string, string>()
export function withAlpha(color: string, alpha: number) {
  const key = `${color}|${alpha}`
  const hit = alphaCache.get(key)
  if (hit) return hit
  let out = color
  if (probe) {
    probe.fillStyle = '#000'
    probe.fillStyle = color
    const c = probe.fillStyle
    if (c.startsWith('#')) {
      const n = parseInt(c.slice(1), 16)
      out = `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
    } else {
      const m = c.match(/[\d.]+/g)
      if (m && m.length >= 3)
        out = `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${alpha * (m[3] ? Number(m[3]) : 1)})`
    }
  }
  alphaCache.set(key, out)
  return out
}

// baris nama mengikuti lebar kotak nama HTML (max-width 7rem di HP, satu baris di layar lebar)
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > max + 0.5) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export function measureItem(button: HTMLElement, ctx: CanvasRenderingContext2D): ItemGeometry {
  const logo = button.querySelector<HTMLElement>('.globe-logo')!
  const name = button.querySelector<HTMLElement>('.globe-name')!
  const ls = getComputedStyle(logo)
  const ns = getComputedStyle(name)
  ctx.font = `${ns.fontWeight} ${ns.fontSize} ${ns.fontFamily}`
  const pad = parseFloat(ls.paddingLeft) || 0
  const lineHeight = parseFloat(ns.lineHeight) || parseFloat(ns.fontSize) * 1.2
  return {
    bw: button.offsetWidth,
    bh: button.offsetHeight,
    lx: logo.offsetLeft + logo.offsetWidth / 2,
    ly: logo.offsetTop + logo.offsetHeight / 2,
    ld: logo.offsetWidth,
    inner: logo.offsetWidth - pad * 2,
    nx: name.offsetLeft + name.offsetWidth / 2,
    ny: name.offsetTop,
    nw: name.offsetWidth,
    lines: wrap(ctx, name.textContent ?? '', name.offsetWidth),
    lineHeight,
  }
}

// Sprite isi logo: <img> (logo asli WebP), <svg> (logo satu warna atau ikon umum, warnanya dari CSS),
// atau singkatan teks. Logo hitam (data-invert-dark) dibalik warnanya di tema gelap, sama dengan CSS.
export async function buildSprite(
  button: HTMLElement,
  size: number,
  dark: boolean,
): Promise<ItemSprite> {
  const logo = button.querySelector<HTMLElement>('.globe-logo')!
  const px = Math.max(8, Math.round(size * SPRITE_SCALE))
  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')!
  const img = logo.querySelector('img')
  const svg = logo.querySelector('svg')
  let source: CanvasImageSource | null = null
  let invert = false
  if (img) {
    img.loading = 'eager'
    await img.decode().catch(() => undefined)
    source = img
    invert = dark && img.hasAttribute('data-invert-dark')
  } else if (svg) {
    const color = getComputedStyle(svg).color
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(px))
    clone.setAttribute('height', String(px))
    clone.setAttribute('color', color)
    clone.style.color = color
    const image = new Image()
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
    await image.decode().catch(() => undefined)
    source = image
  }
  if (source) {
    const sw = (source as HTMLImageElement).naturalWidth || px
    const sh = (source as HTMLImageElement).naturalHeight || px
    const k = Math.min(px / sw, px / sh)
    const w = sw * k
    const h = sh * k
    ctx.drawImage(source, (px - w) / 2, (px - h) / 2, w, h)
  } else {
    const ts = getComputedStyle(logo.firstElementChild ?? logo)
    ctx.fillStyle = ts.color
    ctx.font = `700 ${px * 0.32}px ${ts.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(logo.textContent?.trim() ?? '', px / 2, px / 2)
  }
  if (invert) recolor(canvas, (r, g, b) => [255 - r, 255 - g, 255 - b])
  // versi abu-abu untuk kategori yang diredupkan (filter: grayscale(1) di CSS)
  const gray = document.createElement('canvas')
  gray.width = canvas.width
  gray.height = canvas.height
  gray.getContext('2d')!.drawImage(canvas, 0, 0)
  recolor(gray, (r, g, b) => {
    const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    return [y, y, y]
  })
  return { normal: await toBitmap(canvas), gray: await toBitmap(gray) }
}

async function toBitmap(canvas: HTMLCanvasElement): Promise<CanvasImageSource> {
  if (typeof createImageBitmap !== 'function') return canvas
  try {
    return await createImageBitmap(canvas)
  } catch {
    return canvas
  }
}

function recolor(
  canvas: HTMLCanvasElement,
  fn: (r: number, g: number, b: number) => [number, number, number],
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  try {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = data.data
    for (let i = 0; i < d.length; i += 4) {
      const [r, g, b] = fn(d[i]!, d[i + 1]!, d[i + 2]!)
      d[i] = r
      d[i + 1] = g
      d[i + 2] = b
    }
    ctx.putImageData(data, 0, 0)
  } catch {
    // canvas tercemar (tidak mungkin untuk berkas satu origin): biarkan apa adanya
  }
}

export function drawItem(
  ctx: CanvasRenderingContext2D,
  g: ItemGeometry,
  sprite: ItemSprite | undefined,
  s: ItemState,
  p: Palette,
) {
  const k = s.scale * (s.dim ? 0.8 : 1)
  const ox = s.cx - (g.bw / 2) * k
  const oy = s.cy - (g.bh / 2) * k
  const lx = ox + g.lx * k
  const ly = oy + g.ly * k
  const r = (g.ld / 2) * k
  const strong = s.active || s.hl || s.hover
  const alpha = s.active
    ? 1
    : s.hl
      ? Math.max(s.opacity, 0.9)
      : s.dim
        ? s.opacity * 0.12
        : s.opacity
  if (alpha <= 0.002) return
  ctx.globalAlpha = alpha
  // lingkaran: latar kategori 14% (24% saat menonjol), cincin 1,5 px 60% (2 px penuh saat menonjol)
  ctx.beginPath()
  ctx.arc(lx, ly, r, 0, Math.PI * 2)
  if (strong) {
    ctx.save()
    ctx.shadowColor = withAlpha(p.cat, s.active ? 0.6 : 0.55)
    ctx.shadowBlur = (s.active ? 28 : 24) * k
    ctx.fillStyle = withAlpha(p.cat, 0.24)
    ctx.fill()
    ctx.restore()
  } else {
    ctx.fillStyle = withAlpha(p.cat, 0.14)
    ctx.fill()
  }
  ctx.lineWidth = (s.active || s.hl ? 2 : 1.5) * k
  ctx.strokeStyle = strong ? p.cat : withAlpha(p.cat, 0.6)
  ctx.beginPath()
  ctx.arc(lx, ly, r + ctx.lineWidth / 2, 0, Math.PI * 2)
  ctx.stroke()
  if (sprite) {
    const inner = g.inner * k
    ctx.drawImage(s.dim ? sprite.gray : sprite.normal, lx - inner / 2, ly - inner / 2, inner, inner)
  }
  // nama: hanya sisi depan (label), disembunyikan di kategori redup
  const label = s.active ? 1 : s.dim ? 0 : s.label
  if (label > 0.01 && g.lines.length) {
    ctx.globalAlpha = label
    ctx.fillStyle = strong ? p.text : p.muted
    ctx.font = p.font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.save()
    ctx.translate(ox + g.nx * k, oy + g.ny * k)
    ctx.scale(k, k)
    g.lines.forEach((line, i) => ctx.fillText(line, 0, g.lineHeight * (i + 0.5)))
    ctx.restore()
  }
  ctx.globalAlpha = 1
}
