import localFont from 'next/font/local'

// Font di-host sendiri (src/fonts, lisensi OFL) agar build tidak bergantung pada Google Fonts.
// Hanya subset latin: cukup untuk teks ID/EN. Subset latin-ext dihapus (M4) karena tanpa
// unicode-range ikut dimuat di setiap halaman dan memperlambat LCP.
export const jakarta = localFont({
  src: [
    {
      path: '../fonts/plus-jakarta-sans-latin-wght-normal.woff2',
      weight: '200 800',
      style: 'normal',
    },
  ],
  variable: '--font-jakarta',
  display: 'swap',
})

export const jetbrains = localFont({
  src: [
    { path: '../fonts/jetbrains-mono-latin-wght-normal.woff2', weight: '100 800', style: 'normal' },
  ],
  variable: '--font-jetbrains',
  display: 'swap',
  // font label kecil: tidak di-preload agar tidak bersaing dengan font judul (LCP)
  preload: false,
})
