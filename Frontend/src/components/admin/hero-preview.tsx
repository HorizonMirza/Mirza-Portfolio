import Image, { type StaticImageData } from 'next/image'
import type { ReactNode } from 'react'

import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

// Tiruan hero beranda untuk pratinjau admin (DESIGN.md bagian 133): nama besar di belakang, foto
// utama rata bawah di tengah, dan lapisan di atasnya (peran, foto profil). Ukurannya mengikuti
// lebar panggung (container query), bukan layar seperti di situs, jadi hanya mendekati aslinya.
export function HeroPreview({
  name,
  portrait,
  portraitAlt = '',
  portraitSlot,
  children,
}: {
  name: string
  portrait: string | StaticImageData
  portraitAlt?: string
  // pengganti foto utama (mis. tombol yang membungkus foto)
  portraitSlot?: (image: ReactNode) => ReactNode
  children?: ReactNode
}) {
  const words = name.toUpperCase().split(/\s+/)
  const image = (
    <Image
      placeholder={typeof portrait === 'string' ? SHIMMER_PLACEHOLDER : 'empty'}
      src={portrait}
      alt={portraitAlt}
      width={1120}
      height={1100}
      sizes="(min-width: 1024px) 40rem, 90vw"
      className="admin-hero-img"
      draggable={false}
    />
  )
  return (
    <div className="admin-hero">
      <div aria-hidden="true" className="admin-hero-glow" />
      <p aria-hidden="true" className="admin-hero-name">
        <span>{words[0]}</span>
        {words.length > 1 ? <span>{words.slice(1).join(' ')}</span> : null}
      </p>
      <div className="admin-hero-portrait">{portraitSlot ? portraitSlot(image) : image}</div>
      {children}
    </div>
  )
}
