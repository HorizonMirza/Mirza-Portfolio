// Halaman status bersama untuk 11 kode HTTP (angka, ikon melayang, judul, kalimat, tombol).

import {
  CircleCheck,
  Coffee,
  FileQuestion,
  Ghost,
  Hourglass,
  KeyRound,
  type LucideIcon,
  ServerCrash,
  ShieldX,
  Signpost,
  Unplug,
  Wrench,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

// Halaman status untuk 11 kode HTTP, turunan desain "hantu" 404:
// angka depan, ikon melayang di tengah, angka belakang, judul
// Oswald huruf besar, satu kalimat, lalu tombol. Animasi CSS (styles/site/not-found.css .g404-*), tanpa JavaScript
// klien; prefers-reduced-motion mematikan semua gerak. Warna dari token situs, ikut terang/gelap.
// Teks dan tombol dari pemanggil, jadi dua bahasa dan bisa dipakai di situs publik maupun admin.
export const STATUS_CODES = [200, 301, 400, 401, 403, 404, 418, 429, 500, 502, 503] as const
export type StatusCode = (typeof STATUS_CODES)[number]

// ikon pengganti angka tengah, sesuai arti kodenya
const ICON: Record<StatusCode, LucideIcon> = {
  200: CircleCheck,
  301: Signpost,
  400: FileQuestion,
  401: KeyRound,
  403: ShieldX,
  404: Ghost,
  418: Coffee,
  429: Hourglass,
  500: ServerCrash,
  502: Unplug,
  503: Wrench,
}

// urutan muncul berjenjang (pengganti staggerChildren framer-motion)
const stagger = (i: number) => ({ '--i': i }) as CSSProperties

const digit =
  'g404-num font-display text-[80px] leading-none font-bold text-text select-none md:text-[120px]'

export function StatusPage({
  code,
  title,
  body,
  action,
  eyebrow,
  fullHeight = true,
}: {
  code: StatusCode
  title: string
  body: string
  // tombol, mis. tautan ke beranda bergaya flowButtonClassName
  action?: ReactNode
  // teks kecil di atas angka (mis. nama pemilik di mode perawatan)
  eyebrow?: string
  // setinggi layar dikurangi topbar; false untuk pratinjau di dalam bingkai
  fullHeight?: boolean
}) {
  const Icon = ICON[code]
  const text = String(code)
  return (
    <div
      className={
        fullHeight
          ? 'flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4 py-12'
          : 'flex flex-col items-center justify-center px-4 py-16'
      }
    >
      <div className="g404 text-center">
        {eyebrow ? <p className="mb-6 text-sm tracking-wide text-muted">{eyebrow}</p> : null}
        <div
          className="mb-8 flex items-center justify-center gap-4 md:mb-12 md:gap-6"
          aria-hidden="true"
        >
          <span className={`${digit} g404-num-l`}>{text[0]}</span>
          <span className="g404-float">
            <span className="g404-ghost">
              <Icon
                strokeWidth={1.25}
                className="size-[80px] fill-surface text-text md:size-[120px]"
              />
            </span>
          </span>
          <span className={`${digit} g404-num-r`}>{text[2]}</span>
        </div>
        <p className="sr-only">{text}</p>

        <h1
          style={stagger(0)}
          className="g404-item mb-4 font-display text-3xl font-bold text-balance text-text/80 uppercase md:mb-6 md:text-5xl"
        >
          {title}
        </h1>
        {/* satu baris di layar lebar, boleh turun baris di HP */}
        <p
          style={stagger(1)}
          className="g404-item mx-auto mb-8 max-w-md text-lg text-pretty text-muted md:mb-12 md:max-w-3xl md:text-xl"
        >
          {body}
        </p>

        {action ? (
          <div
            style={stagger(2)}
            className="g404-item flex flex-wrap items-center justify-center gap-3"
          >
            {action}
          </div>
        ) : null}
      </div>
    </div>
  )
}
