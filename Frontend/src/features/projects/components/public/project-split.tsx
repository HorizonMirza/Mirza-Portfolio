'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
  ViewTransition,
} from 'react'

import { PhotoTilt } from '@/features/profile/components/photo-tilt'
import { playSlideSound } from '@/lib/ui-sounds'

export type SplitImage = { url: string; alt: string; width: number | null; height: number | null }

// geser jari minimal sejauh ini (px) agar dianggap ganti gambar
const SWIPE_MIN = 40

// Detail project "belah dua" (DESIGN.md bagian 47): gambar besar di kiri (atas di HP), teks di
// kanan. Gambar kecil di bawah teks mengganti gambar besar dengan fade; semua gambar sudah ada di
// HTML sehingga tanpa JavaScript gambar pertama tetap tampil.
// Efek pilihan pemilik (demo efek 1, 6, 8; DESIGN.md bagian 49): gambar besar bisa digeser dengan
// jari, tombol panah, atau tombol panah keyboard dengan bunyi desir; sedikit miring + kilau berbunyi
// mengikuti kursor (mouse saja, agar tidak bentrok dengan geser jari); dan gambar dari daftar
// "terbang" ke sini lewat View Transition bernama sama (`project-{slug}`).
export function ProjectSplit({
  slug,
  images,
  labels,
  children,
}: {
  slug: string
  images: SplitImage[]
  // thumb: "Gambar" / "Image" tanpa angka; angka ditambahkan di sini
  labels: { thumb: string; previous: string; next: string }
  children: ReactNode
}) {
  const [active, setActive] = useState(0)
  const start = useRef<number | null>(null)
  const many = images.length > 1

  function go(next: number) {
    const target = (next + images.length) % images.length
    if (target === active) return
    playSlideSound(next > active)
    setActive(target)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!many) return
    if (event.key === 'ArrowRight') go(active + 1)
    else if (event.key === 'ArrowLeft') go(active - 1)
    else return
    event.preventDefault()
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    // geser dari atas tombol panah diabaikan; tombolnya sendiri yang bekerja lewat klik
    if (event.pointerType === 'mouse' || (event.target as HTMLElement).closest('button')) return
    start.current = event.clientX
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (start.current === null) return
    const dx = event.clientX - start.current
    start.current = null
    if (many && Math.abs(dx) >= SWIPE_MIN) go(active + (dx < 0 ? 1 : -1))
  }

  return (
    <div className="pd-split" onKeyDown={onKeyDown}>
      {images.length > 0 ? (
        <div
          className="pd-media"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (start.current = null)}
        >
          <ViewTransition name={`project-${slug}`} share="morph" default="none">
            <div className="absolute inset-0">
              <PhotoTilt className="pj-tilt pd-tilt" maxTilt={4} touch={false}>
                <div className="pj-tilt-in">
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
                      draggable={false}
                      className="object-cover"
                    />
                  ))}
                  <span className="pj-glare" />
                </div>
              </PhotoTilt>
            </div>
          </ViewTransition>
          {many ? (
            <>
              <button
                type="button"
                className="pd-arrow pd-arrow-prev"
                aria-label={labels.previous}
                onClick={() => go(active - 1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                className="pd-arrow pd-arrow-next"
                aria-label={labels.next}
                onClick={() => go(active + 1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="pd-text">
        {children}
        {many ? (
          <div className="pd-thumbs">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                aria-label={`${labels.thumb} ${i + 1}`}
                aria-pressed={i === active}
                onClick={() => go(i)}
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
