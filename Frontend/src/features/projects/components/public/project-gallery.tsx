'use client'

import Image from 'next/image'
import { type KeyboardEvent, type MouseEvent, useState, ViewTransition } from 'react'

import { imageRatio } from '@/features/projects/browser-address'
import { playSlideSound } from '@/lib/ui-sounds'

export type GalleryImage = { url: string; alt: string; width: number | null; height: number | null }

// Galeri detail project "carousel + strip" (pilihan pemilik 2026-10-08, DESIGN.md bagian 47): satu
// foto besar 16:9 dan deretan gambar kecil di bawahnya. Foto tampil utuh (contain) agar tangkapan
// layar laptop maupun HP tidak terpotong. Semua gambar sudah ada di HTML sehingga
// tanpa JavaScript foto pertama tetap tampil.
// Ganti foto: klik separuh kiri/kanan foto besar, tekan gambar kecil, atau tombol panah keyboard,
// dengan bunyi desir. Tombol panah di atas foto dihapus (revisi pemilik 2026-10-08), geser diganti
// klik kiri/kanan (2026-10-09). Gambar dari
// daftar "terbang" ke sini lewat View Transition bernama sama (`project-{slug}`). Foto sendiri gambar
// biasa: tidak miring, tidak berkilau, dan tidak bisa difokus/ditekan.
export function ProjectGallery({
  slug,
  address,
  images,
  labels,
}: {
  slug: string
  // isi kolom alamat bingkai browser, sama dengan di daftar project
  address: string
  images: GalleryImage[]
  // thumb: "Gambar" tanpa angka; imageOf memakai {current} dan {total}
  labels: { gallery: string; thumb: string; imageOf: string }
}) {
  const [active, setActive] = useState(0)
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

  // Klik/ketuk separuh kiri foto = sebelumnya, separuh kanan = berikutnya, tanpa tanda apa pun di
  // foto (revisi pemilik 2026-10-09: geser dihapus). Gambar kecil dan tombol panah keyboard tetap.
  function onStageClick(event: MouseEvent<HTMLDivElement>) {
    if (!many) return
    const box = event.currentTarget.getBoundingClientRect()
    go(active + (event.clientX - box.left < box.width / 2 ? -1 : 1))
  }

  const counter = labels.imageOf
    .replace('{current}', String(active + 1))
    .replace('{total}', String(images.length))

  return (
    <div role="region" aria-label={labels.gallery} onKeyDown={onKeyDown}>
      {/* bingkai jendela browser seperti di daftar project; rasio foto mengikuti foto pertama agar
          tampil utuh, foto lain menyesuaikan di dalamnya (revisi pemilik 2026-10-08) */}
      <div className="pj-browser">
        <div className="pj-browser-bar" aria-hidden="true">
          <span className="pj-browser-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="pj-browser-url">{address}</span>
        </div>
        {/* keyboard memakai tombol panah (onKeyDown di region) dan gambar kecil */}
        <div
          className="pd-stage"
          style={{ aspectRatio: imageRatio(images[0]) }}
          onClick={onStageClick}
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
        </div>
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
          <p
            className="mt-3 text-center font-display text-base font-medium tracking-wide text-muted"
            aria-live="polite"
          >
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
