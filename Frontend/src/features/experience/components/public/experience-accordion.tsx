'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import { playExperienceToggleSound } from '@/lib/ui-sounds'

// Pembungkus akordion Pengalaman di beranda: isinya tetap dirender server (<details> bawaan
// browser), komponen ini hanya menambah suara saat satu baris dibuka atau ditutup (pilihan pemilik
// 2026-10-16, demo S9). Event "toggle" tidak naik ke induk, jadi didengar pada fase capture.
export function ExperienceAccordion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const onToggle = (event: Event) => {
      const details = event.target
      if (details instanceof HTMLDetailsElement) playExperienceToggleSound(details.open)
    }
    root.addEventListener('toggle', onToggle, true)
    return () => root.removeEventListener('toggle', onToggle, true)
  }, [])

  return (
    <div ref={ref} className="home-xp-list">
      {children}
    </div>
  )
}
