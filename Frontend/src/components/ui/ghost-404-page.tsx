import { Ghost } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

// Halaman 404 "hantu" (komponen 21st.dev ghost-404-page), disesuaikan dengan situs ini:
// - Animasi framer-motion diganti CSS (globals.css .g404-*): tanpa dependency dan tanpa JavaScript
//   klien; prefers-reduced-motion mematikan semua gerak.
// - Gambar hantu dari CDN luar diganti ikon Ghost lucide (CSP hanya mengizinkan gambar sendiri).
// - Warna dan huruf dari token situs (Oswald untuk angka dan judul), ikut mode terang/gelap.
// - Teks dan tautan dari pemanggil, jadi bisa dua bahasa dan memakai Link yang sesuai.
// - Tautan "What means 404?" (href="#") diganti penjelasan yang bisa dibuka (<details>).
// urutan muncul berjenjang (pengganti staggerChildren framer-motion)
const stagger = (i: number) => ({ '--i': i }) as CSSProperties

export function NotFound({
  title,
  body,
  action,
  whatIs,
  whatIsBody,
  subtitle,
}: {
  title: string
  body: string
  // tombol utama, mis. FlowButton sebagai tautan ke beranda
  action: ReactNode
  whatIs: string
  whatIsBody: string
  // baris tambahan di bawah judul, mis. terjemahan Inggris di 404 global
  subtitle?: ReactNode
}) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 py-16">
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
        {subtitle ? (
          <div style={stagger(1)} className="g404-item -mt-2 mb-4 text-muted md:mb-6">
            {subtitle}
          </div>
        ) : null}
        <p
          style={stagger(2)}
          className="g404-item mx-auto mb-8 max-w-md text-lg text-muted md:mb-12 md:text-xl"
        >
          {body}
        </p>

        <div style={stagger(3)} className="g404-item flex justify-center">
          {action}
        </div>

        <details style={stagger(4)} className="g404-item group mx-auto mt-12 max-w-md text-muted">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center underline underline-offset-4 transition-opacity hover:text-text [&::-webkit-details-marker]:hidden">
            {whatIs}
          </summary>
          <p className="mt-2 text-sm">{whatIsBody}</p>
        </details>
      </div>
    </div>
  )
}
