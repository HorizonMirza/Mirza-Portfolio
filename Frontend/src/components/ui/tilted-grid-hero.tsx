'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Tilted Grid Hero: satu baris gambar mengalir dari kanan ke kiri di sisi dalam sebuah silinder
 * (diadaptasi dari komponen 21st.dev "tilted-grid-hero"). Bagian tengah menghadap lurus, kedua
 * ujung melengkung mendekat sehingga gambar di ujung tampak tertekuk, lalu memudar ke halaman.
 *
 * Kotak CSS tidak bisa ditekuk, jadi tiap tile dipotong menjadi SLICES strip vertikal; tiap strip
 * adalah satu bidang datar silinder yang menampilkan bagiannya dari gambar. Strip diam di dalam
 * tile, masing-masing diputar beberapa derajat pada sumbu silinder, dan tile (preserve-3d) yang
 * bergerak: satu rotateY pada sumbu yang sama membawa seluruh tile menyusuri lengkungan. Satu tile
 * satu animasi, jadi strip-nya tidak pernah bergeser sendiri atau menampilkan gambar berbeda. Hanya
 * jeda (delay) tiap tile yang berbeda, dan itu menentukan posisinya di lengkungan. Pita hanya
 * memakai transform di compositor; pudar di ujung berupa mask statis.
 *
 * JavaScript-nya hanya ResizeObserver untuk mengukur putaran, dan penangan yang memberi tile gambar
 * berikutnya setiap kali ia berputar ulang di luar layar. Penyesuaian untuk situs ini: latar
 * placeholder memakai token `bg-surface-2` (di situs ini `bg-muted` adalah warna teks).
 */

// Strip per tile. Tiap strip hanya beberapa derajat lengkungan, terlalu kecil untuk terlihat
// bersegi; kurang dari ini, sudut mulai tampak di tepi atas dan bawah. Lengkungan tajam
// membungkus tile pada busur lebar, jadi butuh sebanyak ini.
const SLICES = 16

// Jarak kamera dari layar, kelipatan jari-jari silinder. Sedikit melewati sumbu, sehingga ujung
// datang sampai dekat lensa dan membesar; jauh lebih mundur, baris menjadi datar.
const CAMERA = 1.6

/**
 * Jari-jari silinder, sebagai bagian dari lebar hero, yang menaruh tepi bingkai `bend` radian di
 * lengkungan bila dilihat dari kamera: r·sinθ · CAMERA / (CAMERA − 1 + cosθ) = lebar / 2, dicari r.
 */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend))
}

// Tile tidak pernah lebih lebar dari bagian hero ini, agar di HP tetangganya tetap terlihat.
const MAX_WIDTH = 55

/**
 * Menata putaran di silinder. Jari-jari menaruh tepi bingkai `bend` radian di lengkungan (lihat
 * `arc`). Sudut dalam derajat: `unit` adalah busur setinggi satu tile, `limit` sejauh mana pusat
 * tile boleh berputar sebelum seluruh tile keluar layar, dan `sweep` letak kedua ujung putaran.
 * Putaran melewati `limit`, jadi tile hanya berputar ulang di luar pandangan, dan dibulatkan ke
 * jumlah tile utuh agar jaraknya tidak melar.
 */
function measure(
  width: number,
  height: number,
  tile: number,
  aspect: number,
  gap: number,
  bend: number,
) {
  const h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect)
  const radius = width * arc(bend)
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 }
  const deg = (rad: number) => (rad * 180) / Math.PI
  const unit = deg(h / radius)
  const pitch = (aspect + gap / 100) * unit
  const limit = deg(bend) + (aspect * unit) / 2
  // Dibatasi agar hero yang sangat sempit tidak memasang ribuan tile.
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)))
  const round = (n: number) => +n.toFixed(4)
  const sweep = round((columns * pitch) / 2)
  return {
    columns,
    sweep,
    unit: round(unit),
    limit: round(Math.min(sweep, limit)),
  }
}

export type TiltedGridImage = {
  src: string
  /** Hanya dipakai bila perlakuan dekoratif dilepas; pita ini aria-hidden. */
  alt?: string
}

export type TiltedGridHeroProps = {
  /**
   * Gambar berjalan berurutan. Tile mengambil gambar berikutnya setiap kali berputar ulang di luar
   * layar, jadi seluruh daftar terputar berapa pun tile yang dibutuhkan. Daftar pendek diulang.
   */
  images: TiltedGridImage[]
  /** Detik untuk maju satu tile (per tile, jadi HP dan layar lebar sama cepatnya). @default 4 */
  speed?: number
  /** Tinggi tile, persen dari tinggi hero. @default 26 */
  tileHeight?: number
  /** Lebar tile dibagi tingginya. @default 16 / 9 */
  aspectRatio?: number
  /** Jarak antar-tile, persen dari tinggi tile. @default 6 */
  gap?: number
  /** Pusat vertikal baris, persen dari tinggi hero. @default 56 */
  axis?: number
  /** Seberapa jauh baris melengkung di tepi bingkai, derajat (5–85). @default 80 */
  curve?: number
  /** Lebar pudar di tiap ujung, persen dari lebar hero. @default 12 */
  fade?: number
  /** Konten di atas pita. */
  children?: React.ReactNode
  className?: string
}

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const orbit = `tgh-o-${id}`
  const tile = `tgh-t-${id}`
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180

  // Null sampai observer mengukur hero. Pita disembunyikan sampai saat itu, jadi lukisan pertama
  // yang ditata untuk ukuran salah tidak pernah terlihat.
  const [layout, setLayout] = React.useState<ReturnType<typeof measure> | null>(null)

  // Gambar yang ditampilkan tiap tile, sebagai posisi di deret gambar. Hanya berubah saat tile
  // berputar ulang (di luar pandangan), jadi perubahan ukuran tidak pernah mengganti gambar di layar.
  const [shown, setShown] = React.useState<Record<number, number>>({})

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend)
      setLayout((prev) =>
        prev?.columns === next.columns && prev.sweep === next.sweep && prev.unit === next.unit
          ? prev
          : next,
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [tileHeight, aspectRatio, gap, bend])

  // Semua gambar diambil di awal: tile mengambil gambar berikutnya sesaat sebelum terlihat lagi,
  // terlambat untuk mulai memuatnya saat itu.
  React.useEffect(() => {
    for (const { src } of images) new Image().src = src
  }, [images])

  const { columns, sweep, unit, limit } =
    layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend)

  // Semua panjang adalah kelipatan tinggi tile, yang mengikuti tinggi hero sampai MAX_WIDTH
  // membatasinya di layar sempit.
  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / aspectRatio).toFixed(4)}cqw))`

  const r = 100 * arc(bend)
  const radius = `${+r.toFixed(3)}cqw`
  // Keluar ke sumbu, berputar, kembali: kotak duduk di silinder pada sudut yang diberi rotateY.
  const turn = (deg: number) =>
    `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`

  // Melewati `limit` tile sudah sepenuhnya di luar layar, jadi disembunyikan di sana. Ujung putaran,
  // tempat ia berputar ulang, ada di rentang itu, begitu juga tile yang berayun ke belakang kamera.
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4)
  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
    // Dijeda, bukan dihapus: tiap tile sudah ditempatkan oleh delay negatifnya, jadi pita berhenti
    // sebagai gambar diam yang utuh.
    `@media(prefers-reduced-motion:reduce){.${tile}{animation-play-state:paused}}`

  const share = aspectRatio / SLICES
  const duration = columns * speed
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${100 - fade}%,transparent)`

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
      style={{ containerType: 'size', ...props.style }}
    >
      <style>{css}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout ? 1 : 0,
          // Satu titik hilang di garis tengah baris, sehingga ujung membesar merata ke atas dan bawah.
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          // Tile `columns - 1` mulai paling dekat pintu keluar dan tile 0 paling belakang, jadi ini
          // menomori tile sesuai urutan masuknya.
          const first = columns - 1 - t
          const img = images[(shown[t] ?? first) % Math.max(images.length, 1)]
          return (
            <div
              key={t}
              className={cn(tile, 'absolute')}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                transformStyle: 'preserve-3d',
                // Tile t mulai t tile di sepanjang putaran.
                animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
              }}
              onAnimationIteration={(e) => {
                // elapsedTime menghitung putaran utuh, termasuk event yang terlewat.
                const lap = Math.round(e.elapsedTime / duration)
                setShown((prev) => {
                  const next = lap * columns + first
                  return prev[t] === next ? prev : { ...prev, [t]: next }
                })
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <div
                  key={k}
                  className={cn(
                    'absolute top-0 overflow-hidden bg-surface-2',
                    k === 0 && 'rounded-l-lg',
                    k === SLICES - 1 && 'rounded-r-lg',
                  )}
                  style={{
                    // Tiap strip mulai di tengah tile lalu diputar pada sumbu ke tempatnya sendiri.
                    left: u((aspectRatio - share) / 2),
                    // Satu piksel lebih lebar dari bagiannya agar bidang bertetangga saling menutup
                    // dan tidak ada garis tipis di antaranya. Yang terakhir tidak punya tetangga.
                    width: k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn((aspectRatio / 2 - (k + 0.5) * share) * unit),
                  }}
                >
                  {img ? (
                    // Potongan gambar per strip: posisi dan ukuran dihitung per bidang, jadi bukan
                    // next/image (yang tidak menerima geometri ini).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.src}
                      alt={k === 0 ? (img.alt ?? '') : ''}
                      draggable={false}
                      className="absolute top-0 max-w-none object-cover"
                      style={{
                        left: u(-k * share),
                        width: u(aspectRatio),
                        height: u(1),
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {children}
    </div>
  )
}

export default TiltedGridHero
