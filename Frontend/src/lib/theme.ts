// Kunci penyimpanan pilihan tema (next-themes dan tombol tema). Diganti dari 'theme' pada 2026-10-20
// (permintaan pemilik "default dark mode"): pilihan lama yang tersimpan, termasuk terang, diabaikan
// sekali sehingga semua pengunjung kembali mulai dari tema gelap. Tema tidak lagi mengikuti sistem.
export const THEME_STORAGE_KEY = 'mmirza-theme'

export type SiteTheme = 'light' | 'dark'

// pilihan tersimpan, atau gelap bila belum ada / penyimpanan diblokir
export function storedTheme(): SiteTheme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyThemeClass(theme: SiteTheme) {
  const root = document.documentElement
  if (
    !root.classList.contains(theme) ||
    root.classList.contains(theme === 'dark' ? 'light' : 'dark')
  ) {
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
  root.style.colorScheme = theme
}
