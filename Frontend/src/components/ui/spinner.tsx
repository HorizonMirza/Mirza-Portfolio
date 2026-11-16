import { cn } from '@/lib/utils'

// Loading biasa (permintaan pemilik 2026-11-16): lingkaran berputar untuk aksi yang menunggu server
// (simpan, hapus, unggah, keluar). Perpindahan halaman memakai skeleton shimmer sesuai bentuk halaman.
// Warna mengikuti teks tombolnya (currentColor). Dengan prefers-reduced-motion putarannya diperlambat,
// bukan dihentikan, karena putaran inilah satu-satunya tanda bahwa aksi masih berjalan.
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(
        'size-4 shrink-0 animate-spin motion-reduce:[animation-duration:1.6s]! motion-reduce:[animation-iteration-count:infinite]!',
        className,
      )}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
