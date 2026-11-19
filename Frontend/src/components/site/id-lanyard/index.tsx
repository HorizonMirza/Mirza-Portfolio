'use client'

// Kartu ID bertali di samping form kontak. Fisika ditulis sendiri tanpa library: tali berupa
// rantai titik verlet dan kartu berupa batang kaku dua titik, sehingga kartu bisa ditarik,
// dilempar, berayun, berputar semu 3D, dan memantul pelan dari tepi.
// Tema gelap: kartu kaca + pita putih bertulisan hitam. Tema terang: kartu logam + pita hitam
// bertulisan putih. Murni hiasan: informasi yang sama ada di halaman lain, jadi disembunyikan dari
// pembaca layar (kecuali di pratinjau admin, tempat jabatan dan foto bisa diubah).
// Berkas: physics.ts (fisika), drawing.ts (gambar), engine.ts (loop dan interaksi).

import type { StaticImageData } from 'next/image'
import { type ReactNode, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

import { createLanyard, type LanyardEngine } from './engine'
import { BOX_H, CANVAS_W, CARD_W, EXTRA_BOTTOM, PHOTO_H, ROPE_LEN } from './physics'

export function IdLanyard({
  name,
  role,
  photo,
  photoCrop,
  site,
  className,
  editable,
}: {
  name: string
  role: string
  photo: string | StaticImageData
  // bagian foto yang dipakai (pecahan lebar/tinggi asli), mis. potongan kepala dan bahu dari potret
  // hero; tanpa ini seluruh foto dipakai
  photoCrop?: { x: number; y: number; w: number; h: number }
  site: string
  className?: string
  // Pratinjau admin (Admin → Contact): kartu diam (tidak bisa ditarik) dengan foto dan jabatan yang
  // bisa diubah. Foto bergaris putus-putus di kanvas dan ditekan untuk diganti; jabatan diketik di
  // `roleSlot`, yang menimpa tulisan jabatan di kartu; `photoTools` di sudut foto.
  editable?: { onPhoto: () => void; roleSlot: ReactNode; photoTools?: ReactNode }
}) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  // jabatan, foto, dan mode ubah dibaca lewat ref agar kartu tidak dibangun ulang (kembali ke posisi
  // awal) setiap jabatan diketik atau foto diganti
  const roleRef = useRef(role)
  const photoSrc = typeof photo === 'string' ? photo : photo.src
  const photoRef = useRef(photoSrc)
  const editRef = useRef(editable)
  const api = useRef<LanyardEngine | null>(null)
  useEffect(() => {
    roleRef.current = role
    photoRef.current = photoSrc
    editRef.current = editable
    api.current?.redraw()
  })
  useEffect(() => {
    api.current?.setPhoto(photoSrc)
  }, [photoSrc])

  useEffect(() => {
    if (!canvas.current || !box.current) return
    const engine = createLanyard({
      canvas: canvas.current,
      box: box.current,
      name,
      site,
      photoCrop,
      photoRef,
      roleRef,
      editRef,
    })
    api.current = engine
    return () => {
      engine?.destroy()
      api.current = null
    }
  }, [name, photoCrop, site])

  return (
    <div
      ref={box}
      aria-hidden={editable ? undefined : 'true'}
      className={cn('lanyard-box relative z-10 select-none', className)}
      style={{ height: BOX_H }}
    >
      <canvas
        ref={canvas}
        className="pointer-events-none absolute top-0"
        // sebelum JavaScript: selebar CANVAS_W di tengah kolom; mesin memperluasnya
        style={{
          width: CANVAS_W,
          left: `calc(50% - ${CANVAS_W / 2}px)`,
          height: BOX_H + EXTRA_BOTTOM,
        }}
      />
      {editable ? (
        <>
          {/* jabatan diketik tepat di tempat tulisannya di kartu (kartu diam di pratinjau admin) */}
          <div
            className="absolute"
            style={{
              left: `calc(50% - ${CARD_W / 2 - 12}px)`,
              top: ROPE_LEN + PHOTO_H + 62,
              width: CARD_W - 24,
            }}
          >
            {editable.roleSlot}
          </div>
          {editable.photoTools ? (
            <div
              className="absolute"
              style={{ left: `calc(50% + ${CARD_W / 2 - 12 - 36}px)`, top: ROPE_LEN + 32 }}
            >
              {editable.photoTools}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
