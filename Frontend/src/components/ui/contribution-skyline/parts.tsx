// Potongan tampilan grafik kontribusi: ikon tombol 2D/3D dan satu kotak statistik.

export const GridIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ maxWidth: 'none' }}>
    <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
    <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
    <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" fill="currentColor" />
    <rect x="9" y="9" width="5.5" height="5.5" rx="1" fill="currentColor" />
  </svg>
)

export const CubeIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ maxWidth: 'none' }}>
    <path
      d="M8 1.2 14.2 4.6v6.8L8 14.8 1.8 11.4V4.6Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M1.8 4.6 8 8l6.2-3.4M8 8v6.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

// Label, angka besar, dan rentang tanggal (bulan lengkap mulai 768 px, singkat di HP). Satuan
// (kontribusi/hari) tidak ditampilkan, tetapi tetap dibacakan pembaca layar.
export function Stat({
  label,
  value,
  unit,
  sub,
  subLong,
  accent,
}: {
  label: string
  value: string
  unit: string
  sub: string
  subLong: string
  accent: string
}) {
  return (
    // angka dan tanggal dirapatkan ke bawah agar sejajar walau label di HP turun dua baris
    <div className="flex min-w-0 flex-col bg-bg px-2 py-3 sm:p-4">
      <div className="text-[clamp(0.5rem,2.3vw,0.625rem)] leading-tight font-semibold whitespace-nowrap text-muted uppercase sm:text-xs sm:tracking-wider">
        {label}
      </div>
      <div
        className="mt-auto pt-1.5 font-display text-[2rem] leading-none font-bold tabular-nums transition-colors duration-500 motion-reduce:transition-none sm:text-[2.6rem]"
        style={{ color: accent }}
      >
        {value}
        <span className="sr-only"> {unit}</span>
      </div>
      <div className="mt-1.5 text-xs text-muted tabular-nums sm:text-sm">
        <span className="md:hidden">{sub}</span>
        <span className="hidden md:inline">{subLong}</span>
      </div>
    </div>
  )
}
