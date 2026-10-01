import localFont from 'next/font/local'

// Font di-host sendiri (src/fonts, lisensi OFL) agar build tidak bergantung pada Google Fonts.
// Hanya subset latin: cukup untuk teks ID/EN. Subset latin-ext tidak dipakai (M4) karena tanpa
// unicode-range ikut dimuat di setiap halaman dan memperlambat LCP.
// Pilihan pemilik 2026-10-01: Oswald untuk judul, Inter untuk teks, JetBrains Mono untuk label.

export const inter = localFont({
  src: [{ path: '../fonts/inter-latin-wght-normal.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-inter',
  display: 'swap',
  // teks isi bukan elemen LCP (judul Oswald), jadi tidak di-preload agar judul tampil lebih cepat
  preload: false,
})

// judul (termasuk elemen LCP di beranda), jadi tetap di-preload
export const oswald = localFont({
  src: [{ path: '../fonts/oswald-latin-wght-normal.woff2', weight: '200 700', style: 'normal' }],
  variable: '--font-oswald',
  display: 'swap',
  // fallback condensed agar lompatan tata letak saat font dimuat tetap kecil
  fallback: ['Arial Narrow', 'Roboto Condensed', 'sans-serif'],
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

export const fontVariables = `${inter.variable} ${oswald.variable} ${jetbrains.variable}`
