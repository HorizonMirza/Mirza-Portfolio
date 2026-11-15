// Warna grafik kontribusi GitHub di beranda (DESIGN.md bagian 149). Tanpa import klien atau server,
// jadi dipakai bersama oleh komponen grafik (klien), form admin, dan pengaturan situs (server).

/** Empat warna per tema, dari aktivitas paling ringan ke paling berat. */
export type Palette = { light: string[]; dark: string[] }

// Sama dengan token --gh-1 sampai --gh-4 di globals.css (canvas tidak bisa membaca var()).
// Biru situs, menggantikan hijau khas GitHub (pilihan pemilik 2026-10-16, demo W1); tingkat
// terkuat sama dengan --note sehingga angka statistik memakai warna aksen situs.
export const GITHUB_PALETTE: Palette = {
  light: ['#b9d2f8', '#6e9de8', '#2f6fd6', '#1b4c9c'],
  dark: ['#10294a', '#184a8a', '#2f78d6', '#4da3ff'],
}

export const PALETTE_LEVELS = 4
export const HEX_COLOR = /^#[0-9a-f]{6}$/i

const validColors = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length === PALETTE_LEVELS &&
  value.every((c) => typeof c === 'string' && HEX_COLOR.test(c))

// Nilai dari kolom JSON database → palet yang pasti sah, atau null (memakai warna bawaan). Isi yang
// diubah manual di database dan tidak sah tidak merusak grafik.
export function toPalette(value: unknown): Palette | null {
  if (typeof value !== 'object' || value === null) return null
  const { light, dark } = value as Record<string, unknown>
  if (!validColors(light) || !validColors(dark)) return null
  return { light: light.map((c) => c.toLowerCase()), dark: dark.map((c) => c.toLowerCase()) }
}

export function isDefaultPalette(palette: Palette): boolean {
  const same = (a: string[], b: string[]) => a.every((c, i) => c.toLowerCase() === b[i])
  return same(palette.light, GITHUB_PALETTE.light) && same(palette.dark, GITHUB_PALETTE.dark)
}
