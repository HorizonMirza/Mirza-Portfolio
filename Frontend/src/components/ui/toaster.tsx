'use client'

import { useTheme } from 'next-themes'
import { Toaster as SonnerToaster } from 'sonner'

// Notifikasi hasil aksi admin (role="status", dibacakan pembaca layar).
export function Toaster() {
  const { resolvedTheme } = useTheme()
  return (
    <SonnerToaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
    />
  )
}
