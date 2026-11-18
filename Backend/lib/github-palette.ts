// Warna grafik kontribusi GitHub di beranda (revisi 2026-11-15). Tanpa import klien atau server,
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

// Lima pilihan warna di Admin → Home → GitHub (revisi pemilik 2026-11-15): merah, kuning, hijau, biru
// (bawaan), dan ungu. Tiap pilihan punya empat tingkat untuk tema terang dan gelap.
export const GITHUB_PRESET_KEYS = ['red', 'yellow', 'green', 'blue', 'purple'] as const
export type GithubPresetKey = (typeof GITHUB_PRESET_KEYS)[number]

export const GITHUB_PRESETS: Record<GithubPresetKey, Palette> = {
  red: {
    light: ['#f7c6c6', '#ec8b8b', '#d94a4a', '#a52828'],
    dark: ['#3a1212', '#7a2222', '#d13a3a', '#ff6b6b'],
  },
  yellow: {
    light: ['#fbe9a6', '#f4cf55', '#d9a514', '#9a6f00'],
    dark: ['#33290a', '#6e5710', '#c29a1c', '#ffd23f'],
  },
  green: {
    light: ['#bfe8c5', '#7bcf8b', '#2fa84f', '#1a6e33'],
    dark: ['#0e2e1a', '#17592e', '#2fa853', '#4ade80'],
  },
  blue: GITHUB_PALETTE,
  purple: {
    light: ['#dcc9f5', '#b18ae6', '#8a52d4', '#5b2a9c'],
    dark: ['#25123f', '#4b2482', '#8a52d4', '#b78cff'],
  },
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

const samePalette = (a: Palette, b: Palette) =>
  a.light.every((c, i) => c.toLowerCase() === b.light[i]) &&
  a.dark.every((c, i) => c.toLowerCase() === b.dark[i])

export function isDefaultPalette(palette: Palette): boolean {
  return samePalette(palette, GITHUB_PALETTE)
}

// Pilihan yang sedang dipakai; palet yang tidak cocok dengan pilihan mana pun (mis. diubah manual di
// database) dianggap biru bawaan.
export function presetOf(palette: Palette | null): GithubPresetKey {
  if (!palette) return 'blue'
  return GITHUB_PRESET_KEYS.find((key) => samePalette(palette, GITHUB_PRESETS[key])) ?? 'blue'
}
