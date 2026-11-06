'use client'

import { X } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

import { PhotoTilt } from '@/features/profile/components/photo-tilt'
import {
  nativeStartViewTransition,
  prefersReducedMotion,
  touchFirstDevice,
} from '@/lib/view-transition'

// Foto kegiatan di timeline Pengalaman yang bisa ditekan untuk dilihat besar. Pilihan pemilik
// 2026-11-06: C1 "Lightbox klasik", lalu "semua efeknya sama seperti di Project": foto miring 3D
// mengikuti kursor dengan kilau (PhotoTilt, sama dengan gambar di daftar project, tanpa suara), dan
// saat ditekan foto "terbang" dari timeline ke tampilan besar lalu kembali ke tempatnya saat ditutup
// (View Transition bernama sama, kelas .morph 800 ms yang juga dipakai daftar → detail project).
// Memakai <dialog> bawaan (showModal): fokus terkunci di dalam, Esc menutup, halaman di belakang tidak
// bisa diklik; klik area gelap di luar foto juga menutup. Tanpa View Transition (browser lama, layar
// sentuh seperti di daftar project, reduced-motion) dialog memakai animasi CSS biasa (.xp-lightbox).
// Gambar besar lazy: baru diunduh saat kursor mendekati foto atau dialog dibuka.
const MORPH = 'xp-photo'
// batas tunggu gambar besar selesai diunduh sebelum terbang; lewat dari ini langsung dibuka
const DECODE_WAIT_MS = 600

function setMorph(el: HTMLElement | null, on: boolean) {
  if (!el) return
  el.style.setProperty('view-transition-name', on ? MORPH : '')
  el.style.setProperty('view-transition-class', on ? 'morph' : '')
}

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
  const thumb = useRef<HTMLButtonElement>(null)
  const big = useRef<HTMLImageElement>(null)
  const busy = useRef(false)

  function morphable() {
    if (prefersReducedMotion() || touchFirstDevice()) return null
    return nativeStartViewTransition()
  }

  // mulai unduh gambar besar lebih awal (kursor di atas foto, fokus keyboard)
  function preload() {
    if (big.current) big.current.loading = 'eager'
  }

  async function open() {
    const d = dialog.current
    if (!d || d.open || busy.current) return
    const start = morphable()
    if (!start || !big.current) {
      d.showModal()
      return
    }
    busy.current = true
    preload()
    await Promise.race([
      Promise.resolve()
        .then(() => big.current?.decode())
        .catch(() => {}),
      new Promise((resolve) => window.setTimeout(resolve, DECODE_WAIT_MS)),
    ])
    setMorph(thumb.current, true)
    d.dataset.morph = ''
    const transition = start(() => {
      setMorph(thumb.current, false)
      d.showModal()
      setMorph(big.current, true)
    })
    await transition.finished.catch(() => {})
    setMorph(big.current, false)
    delete d.dataset.morph
    busy.current = false
  }

  async function close() {
    const d = dialog.current
    if (!d?.open || busy.current) return
    const start = morphable()
    if (!start) {
      d.close()
      return
    }
    busy.current = true
    setMorph(big.current, true)
    d.dataset.morph = ''
    const transition = start(() => {
      setMorph(big.current, false)
      d.close()
      setMorph(thumb.current, true)
    })
    await transition.finished.catch(() => {})
    setMorph(thumb.current, false)
    delete d.dataset.morph
    busy.current = false
  }

  return (
    <>
      <PhotoTilt className="pj-tilt xp-tilt" maxTilt={8} sound={false}>
        <div className="pj-tilt-in" data-tilt-target="">
          <button
            ref={thumb}
            type="button"
            className="xp-frame xp-zoom"
            aria-haspopup="dialog"
            aria-label={openLabel}
            onClick={() => void open()}
            onPointerEnter={preload}
            onFocus={preload}
          >
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes="(min-width: 1024px) 320px, (min-width: 768px) 40vw, 100vw"
              className="xp-photo"
            />
            <span className="pj-glare" data-tilt-glare="" />
          </button>
        </div>
      </PhotoTilt>
      <dialog
        ref={dialog}
        className="xp-lightbox"
        aria-label={caption}
        // Esc ditangani sendiri agar penutupan juga memakai transisi terbang balik
        onCancel={(event) => {
          event.preventDefault()
          void close()
        }}
        // klik di area gelap (dialog itu sendiri, bukan foto atau keterangan) menutup
        onClick={(event) => {
          if (event.target === event.currentTarget) void close()
        }}
      >
        <button
          type="button"
          className="xp-lightbox-close"
          aria-label={closeLabel}
          onClick={() => void close()}
        >
          <X aria-hidden className="size-5" />
        </button>
        <figure className="xp-lightbox-figure">
          <Image
            ref={big}
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
