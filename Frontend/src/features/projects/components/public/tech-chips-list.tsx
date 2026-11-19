// Chip teknologi project dengan logo kecil (lihat tech-chips.tsx untuk penjelasan pilihan desain).

import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

// Data chip yang sudah diselesaikan di server (logo dan warna), sehingga daftar ini aman dipakai di
// komponen klien (daftar project di admin) tanpa mengimpor modul server-only.
export type ChipData = {
  id: string
  name: string
  // warna brand untuk efek sorot (logo hampir hitam memakai warna teks)
  color: string
  // logo asli berwarna (WebP) atau unggahan admin
  logo: { src: string; invertDark: boolean } | null
  // logo satu warna Simple Icons bila tidak ada logo asli
  brand: { path: string; viewBox?: string; evenOdd?: boolean } | null
}

export function TechChipsList({
  chips,
  label,
  className,
}: {
  chips: ChipData[]
  label: string
  className?: string
}) {
  if (chips.length === 0) return null
  return (
    <ul aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
      {chips.map((c) => (
        <li key={c.id}>
          <span className="pj-tech" style={{ '--brand': c.color } as CSSProperties}>
            {c.logo ? (
              // logo asli berwarna (WebP 144 px dari public/skills, dibuat `pnpm logos:build`)
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.logo.src}
                alt=""
                width={14}
                height={14}
                loading="lazy"
                decoding="async"
                data-invert-dark={c.logo.invertDark ? '' : undefined}
              />
            ) : c.brand ? (
              <svg viewBox={c.brand.viewBox ?? '0 0 24 24'} aria-hidden="true">
                <path d={c.brand.path} fillRule={c.brand.evenOdd ? 'evenodd' : undefined} />
              </svg>
            ) : null}
            {c.name}
          </span>
        </li>
      ))}
    </ul>
  )
}
