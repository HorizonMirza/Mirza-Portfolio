'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { type KeyboardEvent, type PointerEvent, useRef, useState, ViewTransition } from 'react'

import { playSlideSound } from '@/lib/ui-sounds'

export type GalleryImage = { url: string; alt: string; width: number | null; height: number | null }

// geser jari minimal sejauh ini (px) agar dianggap ganti gambar
const SWIPE_MIN = 40

// Galeri detail project "carousel + strip" (pilihan pemilik 2026-10-08, DESIGN.md bagian 47): satu
// foto besar 16:9 dan deretan gambar kecil di bawahnya. Foto tampil utuh (contain) agar tangkapan
// layar laptop maupun HP tidak terpotong. Semua gambar sudah ada di HTML sehingga
// tanpa JavaScript foto pertama tetap tampil.
// Efek yang dipertahankan dari pilihan efek sebelumnya (DESIGN.md bagian 49): geser dengan jari,
// tombol panah, atau tombol panah keyboard dengan bunyi desir; dan gambar dari daftar "terbang" ke
// sini lewat View Transition bernama sama (`project-{slug}`). Foto sendiri gambar biasa: tidak
// miring, tidak berkilau, dan tidak bisa difokus/ditekan (revisi pemilik 2026-10-08).
export function ProjectGallery({
  slug,
  images,
  labels,
}: {
  slug: string
  images: GalleryImage[]
  // thumb: "Gambar" tanpa angka; imageOf memakai {current} dan {total}
  labels: { gallery: string; thumb: string; previous: string; next: string; imageOf: string }
}) {
  const [active, setActive] = useState(0)
  const start = useRef<number | null>(null)
  const many = images.length > 1

  if (images.length === 0) return null

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

  const counter = labels.imageOf
    .replace('{current}', String(active + 1))
    .replace('{total}', String(images.length))

  return (
    <div role="region" aria-label={labels.gallery} onKeyDown={onKeyDown}>
      <div
        className="pd-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (start.current = null)}
      >
        <ViewTransition name={`project-${slug}`} share="morph" default="none">
          <div className="absolute inset-0">
            {images.map((img, i) => (
              <Image
                key={img.url}
                src={img.url}
                alt={i === active ? img.alt : ''}
                aria-hidden={i === active ? undefined : true}
                data-active={i === active}
                fill
                sizes="(min-width: 1280px) 1200px, 100vw"
                priority={i === 0}
                draggable={false}
                className="object-contain"
              />
            ))}
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
      {many ? (
        <>
          <div className="pd-thumbs">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                aria-label={`${labels.thumb} ${i + 1}`}
                aria-pressed={i === active}
                onClick={() => go(i)}
              >
                <Image src={img.url} alt="" fill sizes="76px" className="object-cover object-top" />
              </button>
            ))}
          </div>
          <p className="mt-3 text-center font-mono text-sm text-muted" aria-live="polite">
            <span className="sr-only">{counter}</span>
            <span aria-hidden="true">
              {active + 1} / {images.length}
            </span>
          </p>
        </>
      ) : null}
    </div>
  )
}
