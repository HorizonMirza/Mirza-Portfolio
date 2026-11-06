'use client'

import { createContext, useContext } from 'react'

import type { ContentLang } from '@/components/admin/admin-lang'

// Kode bahasa kecil di samping label isian dua bahasa (ID/EN), sama di semua form admin. Bahasa
// yang tampil dipilih lewat tombol ID/EN di top bar; kode ini hanya penanda visual.
export function LangChip({ lang }: { lang: ContentLang }) {
  return (
    <span
      aria-hidden="true"
      className="rounded-sm border border-border px-1.5 font-mono text-[0.6875rem] font-normal text-muted uppercase"
    >
      {lang}
    </span>
  )
}

// Diisi BilingualTabs untuk tiap panel bahasa, dibaca Field agar labelnya ikut diberi kode bahasa.
export const FieldLangContext = createContext<ContentLang | null>(null)

export function useFieldLang() {
  return useContext(FieldLangContext)
}
