'use client'

import Image from 'next/image'
import { type ReactNode, useState } from 'react'

export type SplitImage = { url: string; alt: string; width: number | null; height: number | null }

// Detail project "belah dua" (DESIGN.md bagian 47): gambar besar di kiri (atas di HP), teks di
// kanan. Gambar kecil di bawah teks mengganti gambar besar dengan fade; semua gambar sudah ada di
// HTML sehingga tanpa JavaScript gambar pertama tetap tampil.
export function ProjectSplit({
  images,
  thumbLabel,
  children,
}: {
  images: SplitImage[]
  // "Gambar {n}" / "Image {n}" tanpa angka; angka ditambahkan di sini
  thumbLabel: string
  children: ReactNode
}) {
  const [active, setActive] = useState(0)

  return (
    <div className="pd-split">
      {images.length > 0 ? (
        <div className="pd-media">
          {images.map((img, i) => (
            <Image
              key={img.url}
              src={img.url}
              alt={i === active ? img.alt : ''}
              aria-hidden={i === active ? undefined : true}
              data-active={i === active}
              fill
              sizes="(min-width: 900px) 50vw, 100vw"
              priority={i === 0}
              className="object-cover"
            />
          ))}
        </div>
      ) : null}
      <div className="pd-text">
        {children}
        {images.length > 1 ? (
          <div className="pd-thumbs">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                aria-label={`${thumbLabel} ${i + 1}`}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
              >
                <Image src={img.url} alt="" fill sizes="72px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
