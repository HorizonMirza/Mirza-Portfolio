'use client'

import { useTheme } from 'next-themes'
import { Toaster as SonnerToaster } from 'sonner'

// Notifikasi hasil aksi admin (role="status", dibacakan pembaca layar). Di atas agar tidak menutupi
// tombol Simpan yang menempel di bawah layar HP.
export function Toaster() {
  const { resolvedTheme } = useTheme()
  return (
    <SonnerToaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="top-right"
      richColors
      closeButton
    />
  )
}
