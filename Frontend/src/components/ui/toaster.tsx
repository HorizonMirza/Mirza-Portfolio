'use client'

import { useTheme } from 'next-themes'
import { Toaster as SonnerToaster } from 'sonner'

// Notifikasi hasil aksi admin (role="status", dibacakan pembaca layar), di kanan bawah untuk semua
// halaman (revisi pemilik 2026-11-16). Di HP dinaikkan agar tidak menutupi tombol Simpan dan menu bawah.
export function Toaster() {
  const { resolvedTheme } = useTheme()
  return (
    <SonnerToaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      mobileOffset={{ bottom: 96, left: 16, right: 16 }}
      richColors
      closeButton
    />
  )
}
