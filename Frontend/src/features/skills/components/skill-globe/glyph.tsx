// Isi visual satu logo skill di globe: gambar WebP asli, ikon brand SVG, ikon umum lucide, atau
// singkatan teks bila tidak ada logo.

import { FileSpreadsheet, Megaphone, SquareKanban, Users } from 'lucide-react'

import type { GenericGlyph, SkillItem } from '@backend/features/skills/skill-items'

const GENERIC_ICONS = {
  kanban: SquareKanban,
  users: Users,
  megaphone: Megaphone,
  sheet: FileSpreadsheet,
} satisfies Record<GenericGlyph, unknown>

export function Glyph({ item }: { item: SkillItem }) {
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
