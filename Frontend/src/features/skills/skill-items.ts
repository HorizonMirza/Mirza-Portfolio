import 'server-only'

import { loc } from '@/lib/localized'
import type { AppLocale } from '@/i18n/routing'

import { BRAND_ICONS } from './brand-icons'
import type { PublicSkillCategory } from './public'
import { SKILL_LOGOS } from './skill-logos'

// Ikon umum (lucide) untuk skill non-teknis yang tidak punya logo brand. Nama dipetakan di klien.
export type GenericGlyph = 'kanban' | 'users' | 'megaphone' | 'sheet'

// Satu skill di globe beranda (components/skill-globe.tsx)
export type SkillItem = {
  id: string
  name: string
  category: string
  // urutan kategori (0..n), menentukan warna kategori --cat-1..--cat-6
  categoryIndex: number
  // warna logo brand; null = mengikuti warna teks (logo hitam seperti Next.js, GitHub, Vercel)
  logoColor: string | null
  glyph:
    | { kind: 'image'; src: string; invertDark: boolean }
    | { kind: 'brand'; path: string; viewBox?: string; evenOdd?: boolean }
    | { kind: 'generic'; name: GenericGlyph }
    | null
  // teks pengganti bila tidak ada ikon
  label: string
}

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
  vscode: 'visualstudiocode',
  word: 'microsoftword',
  msword: 'microsoftword',
  excel: 'microsoftexcel',
  msexcel: 'microsoftexcel',
  powerpoint: 'microsoftpowerpoint',
  ppt: 'microsoftpowerpoint',
  codex: 'openai',
  googleantigravity: 'antigravity',
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

// logo brand yang hampir hitam tidak terlihat di tema gelap, jadi memakai warna teks
export function logoColorFor(hex: string) {
  return luminance(hex.replace('#', '')) < 0.02 ? null : `#${hex.replace('#', '')}`
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

// logo asli berwarna (public/skills) bila ada, dicari dengan aturan slug yang sama dengan resolveIcon
export function resolveLogo(name: string, icon: string | null) {
  const candidates = [icon, iconSlug(name)].filter((s): s is string => Boolean(s))
  for (const candidate of candidates) {
    const slug = ALIASES[candidate] ?? candidate
    const logo = SKILL_LOGOS[slug]
    if (logo) return { src: `/skills/${slug}.svg`, invertDark: Boolean(logo.invertDark) }
  }
  return null
}

export function resolveIcon(name: string, icon: string | null) {
  const candidates = [icon, iconSlug(name)].filter((s): s is string => Boolean(s))
  for (const slug of candidates) {
    const brand = BRAND_ICONS[ALIASES[slug] ?? slug]
    if (brand) return brand
  }
  return null
}

export function toSkillItems(categories: PublicSkillCategory[], locale: AppLocale): SkillItem[] {
  return categories.flatMap((c, categoryIndex) =>
    c.skills.map((s) => {
      const logo = resolveLogo(s.name, s.icon)
      const brand = resolveIcon(s.name, s.icon)
      const generic = brand ? undefined : GENERIC.find((g) => g.pattern.test(s.name))
      return {
        id: s.id,
        name: s.name,
        category: loc(c, 'name', locale),
        categoryIndex,
        logoColor: brand ? logoColorFor(brand.hex) : null,
        glyph: logo
          ? { kind: 'image', ...logo }
          : brand
            ? { kind: 'brand', path: brand.path, viewBox: brand.viewBox, evenOdd: brand.evenOdd }
            : generic
              ? { kind: 'generic', name: generic.glyph }
              : null,
        label: monogram(s.name),
      }
    }),
  )
}
