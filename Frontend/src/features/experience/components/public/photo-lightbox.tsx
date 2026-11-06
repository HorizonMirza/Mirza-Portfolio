'use client'

import { X } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

// Foto kegiatan di timeline Pengalaman yang bisa ditekan untuk dilihat besar (pilihan pemilik
// 2026-11-06 dari 10 demo: C1 "Lightbox klasik"). Memakai <dialog> bawaan (showModal): fokus
// terkunci di dalam, Esc menutup, halaman di belakang tidak bisa diklik. Klik area gelap di luar foto
// juga menutup. Animasi masuk murni CSS (@starting-style, globals.css .xp-lightbox). Gambar besar
// memakai loading lazy sehingga baru diunduh saat dialog pertama kali dibuka.
export function PhotoLightbox({
  src,
  alt,
  width,
  height,
  caption,
  detail,
  openLabel,
  closeLabel,
}: {
  src: string
  alt: string
  width: number
  height: number
  caption: string
  detail: string
  openLabel: string
  closeLabel: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = () => dialog.current?.close()

  return (
    <>
      <button
        type="button"
        className="xp-frame xp-zoom"
        aria-haspopup="dialog"
        aria-label={openLabel}
        onClick={() => dialog.current?.showModal()}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(min-width: 1024px) 320px, (min-width: 768px) 40vw, 100vw"
          className="xp-photo"
        />
      </button>
      <dialog
        ref={dialog}
        className="xp-lightbox"
        aria-label={caption}
        // klik di area gelap (dialog itu sendiri, bukan foto atau keterangan) menutup
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
      >
        <button type="button" className="xp-lightbox-close" aria-label={closeLabel} onClick={close}>
          <X aria-hidden className="size-5" />
        </button>
        <figure className="xp-lightbox-figure">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(min-width: 1200px) 1100px, 92vw"
            loading="lazy"
            className="xp-lightbox-img"
          />
          <figcaption className="xp-lightbox-cap">
            {caption}
            <small>{detail}</small>
          </figcaption>
        </figure>
      </dialog>
    </>
  )
}
