import Image from 'next/image'
import type { ReactNode } from 'react'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

export type PhotoCardChip = {
  name: string
  initials: string
  logo: { url: string } | null
}

function initialsOf(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return (
    words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)
  ).toUpperCase()
}

// Isi chip kartu foto: teks dan logo yang diisi di Admin → About dipakai lebih dulu; bila teks kosong,
// ikut pendidikan terbaru (nama dan logonya). Logo pendidikan tidak dipasang di samping teks buatan
// sendiri supaya tidak tertukar (mis. teks perusahaan dengan logo kampus). Tanpa teks: chip tidak tampil.
export function chipFrom({
  label,
  logo,
  fallbackName,
  fallbackLogo,
}: {
  label: string
  logo: { url: string } | null
  fallbackName: string
  fallbackLogo: { url: string } | null
}): PhotoCardChip | null {
  const custom = label.trim()
  const name = custom || fallbackName
  if (!name) return null
  return {
    name,
    initials: initialsOf(name),
    logo: logo ?? (custom ? null : fallbackLogo),
  }
}

// Kartu foto halaman Tentang (pilihan C, revisi 2026-10-05): foto tanpa bingkai tebal dan tanpa
// siku bidik, chip kampus di sudut atas, dan chip bendera (kaca, warnanya ikut tema).
// Chip kampus hanya tampil bila datanya ada; fotonya dipasang oleh halaman lewat `photo`.
export function AboutPhotoCard({
  photo,
  chip,
  chipSlot,
  className,
  flag = true,
}: {
  photo: ReactNode
  chip: PhotoCardChip | null
  // pengganti isi chip (admin: teks dan logo bisa diubah langsung); tampil bila `chip` ada
  chipSlot?: ReactNode
  className?: string
  // chip bendera bisa dimatikan di Admin → About → Profil (2026-11-10)
  flag?: boolean
}) {
  return (
    <figure className={className ? `ab-pc ${className}` : 'ab-pc'} data-tilt-target="">
      <div className="ab-pc-frame">
        {photo}
        {/* cahaya yang mengikuti kursor saat kartu dimiringkan (PhotoTilt) */}
        <span className="ab-pc-glare" data-tilt-glare="" aria-hidden="true" />
      </div>
      {chipSlot ? (
        <div className="ab-pc-chip">{chipSlot}</div>
      ) : chip ? (
        <div className="ab-pc-chip">
          <span className="ab-pc-logo" aria-hidden="true">
            {chip.logo ? (
              <Image
                placeholder={SHIMMER_PLACEHOLDER}
                src={chip.logo.url}
                alt=""
                width={72}
                height={72}
                sizes="36px"
                className="size-full object-cover"
              />
            ) : (
              chip.initials
            )}
          </span>
          <span>{chip.name}</span>
        </div>
      ) : null}
      {flag ? (
        <span className="ab-pc-flag" aria-hidden="true">
          <i />
        </span>
      ) : null}
    </figure>
  )
}
