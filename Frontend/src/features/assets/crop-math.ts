// Hitungan pemotong gambar (DESIGN.md bagian 148): bingkai potong berukuran tetap di layar, gambar
// digeser, diputar, dan diperbesar di belakangnya. Murni angka agar mudah dites; dipakai pratinjau
// dan hasil akhir dengan rumus yang sama.

export type Rotation = 0 | 90 | 180 | 270

// ukuran gambar setelah diputar
export function effectiveSize(width: number, height: number, rotation: Rotation) {
  return rotation % 180 === 0 ? { w: width, h: height } : { w: height, h: width }
}

// skala terkecil yang membuat gambar menutupi seluruh bingkai (zoom 1)
export function coverScale(ew: number, eh: number, frameW: number, frameH: number) {
  return Math.max(frameW / ew, frameH / eh)
}

// batas geser: bingkai tidak pernah keluar dari gambar
export function clampOffset(
  offset: { x: number; y: number },
  ew: number,
  eh: number,
  scale: number,
  frameW: number,
  frameH: number,
) {
  const maxX = Math.max(0, (ew * scale - frameW) / 2)
  const maxY = Math.max(0, (eh * scale - frameH) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  }
}

// Ukuran hasil potong: resolusi asli bagian yang terpotong, sisi terpanjang dibatasi maxSide
export function exportSize(frameW: number, frameH: number, scale: number, maxSide: number) {
  const natW = frameW / scale
  const natH = frameH / scale
  const k = Math.min(1, maxSide / Math.max(natW, natH))
  return { width: Math.max(1, Math.round(natW * k)), height: Math.max(1, Math.round(natH * k)) }
}

// pilihan perbandingan bingkai
export type AspectChoice = { key: string; label: string; ratio: number | 'original' }

export const ASPECT_PRESETS: AspectChoice[] = [
  { key: '1:1', label: '1:1', ratio: 1 },
  { key: '4:5', label: '4:5', ratio: 4 / 5 },
  { key: '4:3', label: '4:3', ratio: 4 / 3 },
  { key: '16:9', label: '16:9', ratio: 16 / 9 },
  { key: 'original', label: 'Asli', ratio: 'original' },
]

// Tujuan dengan perbandingan tetap (mis. potret hero) hanya punya satu pilihan
export function aspectChoices(defaultRatio: number | undefined, fixed: boolean): AspectChoice[] {
  if (!defaultRatio) return ASPECT_PRESETS
  const base: AspectChoice = { key: 'default', label: 'Sesuai tempat', ratio: defaultRatio }
  if (fixed) return [base]
  // pilihan yang sama dengan bawaan tidak ditampilkan dua kali
  return [
    base,
    ...ASPECT_PRESETS.filter(
      (p) => p.ratio === 'original' || Math.abs(p.ratio - defaultRatio) > 0.01,
    ),
  ]
}
