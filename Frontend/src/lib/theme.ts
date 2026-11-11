// Kunci penyimpanan pilihan tema (next-themes dan tombol tema). Diganti dari 'theme' pada 2026-10-20
// (permintaan pemilik "default dark mode"): pilihan lama yang tersimpan, termasuk terang, diabaikan
// sekali sehingga semua pengunjung kembali mulai dari tema gelap. Sejak 2026-11-11 tema awal diatur di
// Admin → Pengaturan (gelap, terang, atau ikuti perangkat).
export const THEME_STORAGE_KEY = 'mmirza-theme'

export type SiteTheme = 'light' | 'dark'

// Atribut <html> berisi tema awal dari Admin → Pengaturan (dark | light | system) untuk pengunjung
// yang belum pernah memilih. Tanpa atribut (panel admin): gelap.
export const DEFAULT_THEME_ATTR = 'data-default-theme'

function defaultTheme(): SiteTheme {
  const choice = document.documentElement.getAttribute(DEFAULT_THEME_ATTR)
  if (choice === 'light') return 'light'
  if (choice === 'system')
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  return 'dark'
}

// pilihan tersimpan, atau tema awal situs bila belum ada / penyimpanan diblokir
export function storedTheme(): SiteTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // penyimpanan diblokir: pakai tema awal
  }
  return defaultTheme()
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
