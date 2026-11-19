// Gambar kartu ID di kanvas 2D: pita bertulisan, kartu kaca (tema gelap) atau logam (tema terang),
// foto, nama, jabatan, dan barcode. Koordinat kartu: x dari tengah kartu, y dari tepi atasnya.

import { CARD_H, CARD_W, PHOTO_H, type Point, ROPE_W } from './physics'

export type LanyardFonts = { display: string; mono: string; sans: string }

/** Isi kartu yang berubah per halaman atau per ketikan admin. */
export type CardContent = {
  img: HTMLImageElement
  /** bagian foto yang dipakai (pecahan lebar/tinggi asli); tanpa ini seluruh foto */
  crop?: { x: number; y: number; w: number; h: number }
  name: string
  /** null di pratinjau admin: jabatan diketik lewat kolom HTML di atas kartu */
  role: string | null
  /** pratinjau admin: garis putus-putus menandai foto yang bisa ditekan */
  editing: boolean
  site: string
  bars: { x: number; w: number }[]
  fonts: LanyardFonts
}

/** Garis barcode yang tetap untuk teks yang sama (bukan kode sungguhan). */
export function barcode(text: string) {
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

export function roundRect(
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

function ropePath(ctx: CanvasRenderingContext2D, ropes: Point[]) {
  ctx.beginPath()
  ctx.moveTo(ropes[0].x, ropes[0].y)
  for (let i = 1; i < ropes.length - 1; i++) {
    const mx = (ropes[i].x + ropes[i + 1].x) / 2
    const my = (ropes[i].y + ropes[i + 1].y) / 2
    ctx.quadraticCurveTo(ropes[i].x, ropes[i].y, mx, my)
  }
  ctx.lineTo(ropes[ropes.length - 1].x, ropes[ropes.length - 1].y)
}

/** Pita: putih bertulisan hitam di tema gelap, hitam bertulisan putih di tema terang. */
export function drawRope(
  c: CanvasRenderingContext2D,
  ropes: Point[],
  dark: boolean,
  text: string,
  fonts: LanyardFonts,
) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  ropePath(c, ropes)
  c.strokeStyle = dark ? 'rgb(0 0 0 / 0.5)' : 'rgb(0 0 0 / 0.18)'
  c.lineWidth = ROPE_W + 2
  c.stroke()
  ropePath(c, ropes)
  c.strokeStyle = dark ? '#f5f5f5' : '#0a0a0a'
  c.lineWidth = ROPE_W
  c.stroke()
  // tulisan dicetak huruf demi huruf di sepanjang pita
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
        c.fillText(text[ci % text.length], 0, 0)
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

/** Kartu: kaca dengan kilau yang ikut miring (gelap) atau logam abu tua (terang), lalu isinya. */
export function drawCard(
  c: CanvasRenderingContext2D,
  dark: boolean,
  shine: number,
  card: CardContent,
) {
  const x = -CARD_W / 2
  if (dark) {
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
  // lubang klip
  roundRect(c, -24, 12, 48, 7, 4)
  c.fillStyle = 'rgb(255 255 255 / 0.85)'
  c.fill()
  // foto di atas latar studio abu terang (foto hero berlatar transparan)
  c.save()
  roundRect(c, x + 12, 30, CARD_W - 24, PHOTO_H, 8)
  c.clip()
  const studio = c.createLinearGradient(0, 30, 0, 30 + PHOTO_H)
  studio.addColorStop(0, '#ececee')
  studio.addColorStop(1, '#d6d6da')
  c.fillStyle = studio
  c.fillRect(x + 12, 30, CARD_W - 24, PHOTO_H)
  const { img } = card
  if (img.complete && img.naturalWidth) {
    const crop = card.crop ?? { x: 0, y: 0, w: 1, h: 1 }
    const sw = img.naturalWidth * crop.w
    const sh = img.naturalHeight * crop.h
    const s = Math.max((CARD_W - 24) / sw, PHOTO_H / sh)
    const iw = sw * s
    const ih = sh * s
    c.drawImage(
      img,
      img.naturalWidth * crop.x,
      img.naturalHeight * crop.y,
      sw,
      sh,
      x + 12 + (CARD_W - 24 - iw) / 2,
      30 + (PHOTO_H - ih) * 0.25,
      iw,
      ih,
    )
  }
  c.restore()
  // nama satu baris (huruf mengecil bila tidak muat), jabatan di bawahnya
  c.textBaseline = 'top'
  c.fillStyle = ink
  const label = card.name.toUpperCase()
  let size = 19
  c.font = `700 ${size}px ${card.fonts.display}`
  while (size > 12 && c.measureText(label).width > CARD_W - 24) {
    size -= 0.5
    c.font = `700 ${size}px ${card.fonts.display}`
  }
  c.fillText(label, x + 12, PHOTO_H + 42)
  c.fillStyle = sub
  c.font = `600 10.5px ${card.fonts.sans}`
  if (card.role !== null) c.fillText(card.role.toUpperCase(), x + 12, PHOTO_H + 66, CARD_W - 24)
  if (card.editing) {
    c.save()
    c.setLineDash([4, 3])
    c.lineWidth = 1.2
    c.strokeStyle = 'rgb(255 255 255 / 0.7)'
    c.strokeRect(x + 9, 27, CARD_W - 18, PHOTO_H + 6)
    c.restore()
  }
  // barcode dan alamat situs di bagian bawah
  c.fillStyle = ink
  for (const b of card.bars) c.fillRect(x + 12 + b.x, CARD_H - 40, b.w, 18)
  c.fillStyle = sub
  c.font = `500 8.5px ${card.fonts.mono}`
  c.textAlign = 'center'
  c.fillText(card.site.toUpperCase().split('').join(' '), 0, CARD_H - 17)
  c.textAlign = 'left'
}
