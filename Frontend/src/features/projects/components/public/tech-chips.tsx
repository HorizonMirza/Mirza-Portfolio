import type { CSSProperties } from 'react'

import { resolveIcon, resolveLogo } from '@/features/skills/skill-items'
import { cn } from '@/lib/utils'

// Chip teknologi project dengan logo kecil (pilihan pemilik 2026-10-08, demo efek nomor 7). Logo asli
// berwarna penuh sama dengan globe skill di beranda (public/skills, permintaan pemilik 2026-10-18);
// skill tanpa logo asli memakai logo satu warna Simple Icons (abu-abu, berwarna brand saat disorot).
// Logo brand yang sangat gelap memakai warna teks agar tetap terlihat di tema gelap.
export function TechChips({
  skills,
  label,
  className,
}: {
  skills: { id: string; name: string; icon: string | null }[]
  label: string
  className?: string
}) {
  if (skills.length === 0) return null
  return (
    <ul aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
      {skills.map((s) => {
        const logo = resolveLogo(s.name, s.icon)
        const brand = resolveIcon(s.name, s.icon)
        const color = brand && !isVeryDark(brand.hex) ? `#${brand.hex}` : 'var(--text)'
        return (
          <li key={s.id}>
            <span className="pj-tech" style={{ '--brand': color } as CSSProperties}>
              {logo ? (
                // logo asli SVG statis kecil, isi SVG terisolasi di <img>
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.src}
                  alt=""
                  width={14}
                  height={14}
                  loading="lazy"
                  decoding="async"
                  data-invert-dark={logo.invertDark ? '' : undefined}
                />
              ) : brand ? (
                <svg viewBox={brand.viewBox ?? '0 0 24 24'} aria-hidden="true">
                  <path d={brand.path} fillRule={brand.evenOdd ? 'evenodd' : undefined} />
                </svg>
              ) : null}
              {s.name}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function isVeryDark(hex: string) {
  const n = Number.parseInt(hex, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40
}
