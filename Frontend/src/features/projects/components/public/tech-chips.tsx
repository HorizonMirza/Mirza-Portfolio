import type { CSSProperties } from 'react'

import { resolveIcon } from '@/features/skills/keycaps'
import { cn } from '@/lib/utils'

// Chip teknologi project dengan logo kecil (pilihan pemilik 2026-10-08, demo efek nomor 7). Logo
// sama dengan keyboard skill di beranda (Simple Icons, features/skills/brand-icons.ts). Logo abu-abu
// dan berwarna brand saat disorot; logo brand yang sangat gelap (mis. Next.js) memakai warna teks
// agar tetap terlihat di tema gelap.
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
        const brand = resolveIcon(s.name, s.icon)
        const color = brand && !isVeryDark(brand.hex) ? `#${brand.hex}` : 'var(--text)'
        return (
          <li key={s.id}>
            <span className="pj-tech" style={{ '--brand': color } as CSSProperties}>
              {brand ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={brand.path} />
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
