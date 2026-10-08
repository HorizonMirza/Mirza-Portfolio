import Image from 'next/image'
import type { ReactNode } from 'react'

export type PhotoCardChip = {
  name: string
  initials: string
  logo: { url: string } | null
}

// Kartu foto halaman Tentang (pilihan C, DESIGN.md bagian 39): foto tanpa bingkai tebal, siku bidik
// di empat sudut, chip kampus di sudut atas, dan chip bendera, keduanya kaca gelap agak bening.
// Chip kampus hanya tampil bila datanya ada; fotonya dipasang oleh halaman lewat `photo`.
export function AboutPhotoCard({ photo, chip }: { photo: ReactNode; chip: PhotoCardChip | null }) {
  return (
    <figure className="ab-pc">
      <div className="ab-pc-frame">
        {photo}
        {/* cahaya yang mengikuti kursor saat kartu dimiringkan (PhotoTilt) */}
        <span className="ab-pc-glare" aria-hidden="true" />
        <i className="ab-pc-corner ab-pc-a" aria-hidden="true" />
        <i className="ab-pc-corner ab-pc-b" aria-hidden="true" />
        <i className="ab-pc-corner ab-pc-c" aria-hidden="true" />
        <i className="ab-pc-corner ab-pc-d" aria-hidden="true" />
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
