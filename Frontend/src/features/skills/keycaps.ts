import 'server-only'

import { loc } from '@/lib/localized'
import type { AppLocale } from '@/i18n/routing'

import { BRAND_ICONS } from './brand-icons'
import type { PublicSkillCategory } from './public'

// Ikon umum (lucide) untuk skill non-teknis yang tidak punya logo brand. Nama dipetakan di klien.
export type GenericGlyph = 'kanban' | 'users' | 'megaphone' | 'sheet'

export type Keycap = {
  id: string
  name: string
  category: string
  // warna tutup tombol dan warna logo/teks di atasnya (hitam atau putih, mana yang lebih kontras)
  color: string
  ink: string
  glyph: { kind: 'brand'; path: string } | { kind: 'generic'; name: GenericGlyph } | null
  // teks pengganti bila tidak ada ikon
  label: string
  projects: { slug: string; title: string }[]
}

// tutup tombol netral untuk skill tanpa logo brand
const NEUTRAL_CAP = '#262626'
const INK_DARK = '#0a0a0a'
const INK_LIGHT = '#ffffff'

// nama skill umum yang slug Simple Icons-nya berbeda dari nama
const ALIASES: Record<string, string> = {
  html: 'html5',
  css3: 'css',
  cpp: 'cplusplus',
  next: 'nextdotjs',
  nextjs: 'nextdotjs',
  node: 'nodedotjs',
  nodejs: 'nodedotjs',
  postgres: 'postgresql',
  golang: 'go',
  tailwind: 'tailwindcss',
  reactjs: 'react',
}

const GENERIC: { pattern: RegExp; glyph: GenericGlyph }[] = [
  { pattern: /project|manajemen proyek/i, glyph: 'kanban' },
  { pattern: /communit|komunitas/i, glyph: 'users' },
  { pattern: /marketing|pemasaran/i, glyph: 'megaphone' },
  { pattern: /office|excel|spreadsheet/i, glyph: 'sheet' },
]

// mengikuti aturan slug Simple Icons: "Next.js" -> nextdotjs, "C++" -> cplusplus
export function iconSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]/g, '')
}

function luminance(hex: string) {
  const channels = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// hitam atau putih, mana yang kontrasnya lebih tinggi terhadap warna tombol (selalu >= 4.5:1)
export function inkFor(hex: string) {
  const l = luminance(hex.replace('#', ''))
  const onWhite = 1.05 / (l + 0.05)
  const onBlack = (l + 0.05) / 0.05
  return onWhite >= onBlack ? INK_LIGHT : INK_DARK
}

function monogram(name: string) {
  if (name.length <= 4) return name
  const words = name.split(/\s+/).filter(Boolean)
  return words.length > 1
    ? words
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : name.slice(0, 2)
}

export function resolveIcon(name: string, icon: string | null) {
  const candidates = [icon, iconSlug(name)].filter((s): s is string => Boolean(s))
  for (const slug of candidates) {
    const brand = BRAND_ICONS[ALIASES[slug] ?? slug]
    if (brand) return brand
  }
  return null
}

export function toKeycaps(
  categories: PublicSkillCategory[],
  locale: AppLocale,
  projectTitle: (slug: string) => string,
): Keycap[] {
  return categories.flatMap((c) =>
    c.skills.map((s) => {
      const brand = resolveIcon(s.name, s.icon)
      const generic = brand ? undefined : GENERIC.find((g) => g.pattern.test(s.name))
      const color = brand ? `#${brand.hex}` : NEUTRAL_CAP
      return {
        id: s.id,
        name: s.name,
        category: loc(c, 'name', locale),
        color,
        ink: inkFor(color),
        glyph: brand
          ? { kind: 'brand', path: brand.path }
          : generic
            ? { kind: 'generic', name: generic.glyph }
            : null,
        label: monogram(s.name),
        projects: s.projectSlugs.map((slug) => ({ slug, title: projectTitle(slug) })),
      }
    }),
  )
}
