import { Ghost } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

// Halaman 404 "hantu" (komponen 21st.dev ghost-404-page), disesuaikan dengan situs ini:
// - Animasi framer-motion diganti CSS (globals.css .g404-*): tanpa dependency dan tanpa JavaScript
//   klien; prefers-reduced-motion mematikan semua gerak.
// - Gambar hantu dari CDN luar diganti ikon Ghost lucide (CSP hanya mengizinkan gambar sendiri).
// - Warna dan huruf dari token situs (Oswald untuk angka dan judul), ikut mode terang/gelap.
// - Teks dan tautan dari pemanggil, jadi bisa dua bahasa dan memakai Link yang sesuai.
// - Tautan "What means 404?", baris terjemahan, dan penjelasan 404 dihapus (revisi pemilik
//   2026-10-18): judul, satu kalimat, satu tombol, sesuai bahasa halaman.
// urutan muncul berjenjang (pengganti staggerChildren framer-motion)
const stagger = (i: number) => ({ '--i': i }) as CSSProperties

export function NotFound({
  title,
  body,
  action,
}: {
  title: string
  body: string
  // tombol utama, mis. tautan ke beranda bergaya flowButtonClassName
  action: ReactNode
}) {
  return (
    // isi di tengah layar (revisi pemilik 2026-10-18): setinggi layar dikurangi ruang topbar
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="g404 text-center">
        <div
          className="mb-8 flex items-center justify-center gap-4 md:mb-12 md:gap-6"
          aria-hidden="true"
        >
          <span className="g404-num g404-num-l font-display text-[80px] leading-none font-bold text-text select-none md:text-[120px]">
            4
          </span>
          <span className="g404-float">
            <span className="g404-ghost">
              <Ghost
                strokeWidth={1.25}
                className="size-[80px] fill-surface text-text md:size-[120px]"
              />
            </span>
          </span>
          <span className="g404-num g404-num-r font-display text-[80px] leading-none font-bold text-text select-none md:text-[120px]">
            4
          </span>
        </div>
        <p className="sr-only">404</p>

        <h1
          style={stagger(0)}
          className="g404-item mb-4 font-display text-3xl font-bold text-balance text-text/80 uppercase md:mb-6 md:text-5xl"
        >
          {title}
        </h1>
        {/* satu baris di layar lebar, boleh turun baris di HP */}
        <p
          style={stagger(1)}
          className="g404-item mx-auto mb-8 max-w-md text-lg text-muted md:mb-12 md:max-w-none md:text-xl md:whitespace-nowrap"
        >
          {body}
        </p>

        <div style={stagger(2)} className="g404-item flex justify-center">
          {action}
        </div>
      </div>
    </div>
  )
}
