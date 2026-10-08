import Image from 'next/image'
import type { ReactNode } from 'react'

export type PhotoCardChip = {
  name: string
  initials: string
  logo: { url: string } | null
}

// Kartu foto halaman Tentang (pilihan C, DESIGN.md bagian 39): foto tanpa bingkai tebal dan tanpa
// siku bidik, chip kampus di sudut atas, dan chip bendera (kaca, warnanya ikut tema).
// Chip kampus hanya tampil bila datanya ada; fotonya dipasang oleh halaman lewat `photo`.
export function AboutPhotoCard({ photo, chip }: { photo: ReactNode; chip: PhotoCardChip | null }) {
  return (
    <figure className="ab-pc">
      <div className="ab-pc-frame">
        {photo}
        {/* cahaya yang mengikuti kursor saat kartu dimiringkan (PhotoTilt) */}
        <span className="ab-pc-glare" aria-hidden="true" />
      </div>
      {chip ? (
        <div className="ab-pc-chip">
          <span className="ab-pc-logo" aria-hidden="true">
            {chip.logo ? (
              <Image
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
      <span className="ab-pc-flag" aria-hidden="true">
        <i />
      </span>
    </figure>
  )
}
