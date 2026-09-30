import localFont from 'next/font/local'

// Font di-host sendiri (src/fonts, lisensi OFL) agar build tidak bergantung pada Google Fonts.
export const jakarta = localFont({
  src: [
    {
      path: '../fonts/plus-jakarta-sans-latin-wght-normal.woff2',
      weight: '200 800',
      style: 'normal',
    },
    {
      path: '../fonts/plus-jakarta-sans-latin-ext-wght-normal.woff2',
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
})
