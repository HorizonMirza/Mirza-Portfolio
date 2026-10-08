'use client'

import type { ReactNode } from 'react'

import { playNavSound } from '@/lib/ui-sounds'

// Bunyi "tik kaca" (sama dengan menu utama) saat salah satu tautan/tombol di dalamnya ditekan.
// display: contents, jadi tidak mengubah tata letak. Dipakai tombol Buka demo / Lihat kode di
// detail project (pilihan pemilik 2026-10-08, demo efek nomor 10).
export function ClickSound({ children }: { children: ReactNode }) {
  return (
    <span
      className="contents"
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest('a, button')) playNavSound()
      }}
    >
      {children}
    </span>
  )
}
