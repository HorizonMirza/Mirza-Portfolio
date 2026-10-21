'use client'

import { useLocale } from 'next-intl'
import { useLayoutEffect } from 'react'

import { applyThemeClass, storedTheme } from '@/lib/theme'

// Saat bahasa berganti, React memasang ulang atribut <html> dari layout bahasa baru (class kembali
// hanya berisi font), dan next-themes baru memasang kelas tema lagi setelah layar tergambar: tema
// sempat terang sepersekian detik (laporan pemilik 2026-10-21). Layout effect berjalan pada commit yang
// sama sebelum browser menggambar, jadi kelas tema langsung kembali tanpa kedipan.
export function ThemeClassSync() {
  const locale = useLocale()
  useLayoutEffect(() => {
    applyThemeClass(storedTheme())
  }, [locale])
  return null
}
