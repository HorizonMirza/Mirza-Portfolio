'use client'

import type { ReactNode } from 'react'

import { useAdminLang } from '@/components/admin/admin-lang'
import { FieldLangContext } from '@/components/admin/lang-chip'
import { Button } from '@/components/ui/button'

const LANG_NAME = { id: 'Indonesia', en: 'English' } as const

// Isian dua bahasa: yang tampil hanya bahasa yang dipilih di tombol ID/EN top bar (satu-satunya
// pengalih bahasa isian; tab Indonesia/English di dalam kartu dihapus 2026-11-06 karena dobel).
// Kedua bahasa tetap ter-mount agar validasi berjalan di keduanya; galat di bahasa yang tersembunyi
// diberitahukan dengan tombol untuk pindah ke sana.
export function BilingualTabs({
  errors,
  id,
  en,
}: {
  errors: { id: number; en: number }
  id: ReactNode
  en: ReactNode
}) {
  const { lang, setLang } = useAdminLang()
  const other = lang === 'id' ? 'en' : 'id'
  return (
    <div className="flex flex-col gap-5">
      {errors[other] > 0 ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger"
        >
          <span>
            {errors[other]} galat di isian {LANG_NAME[other]}.
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setLang(other)}>
            Buka isian {LANG_NAME[other]}
          </Button>
        </div>
      ) : null}
      <FieldLangContext value="id">
        <div className={lang === 'id' ? 'flex flex-col gap-5' : 'hidden'}>{id}</div>
      </FieldLangContext>
      <FieldLangContext value="en">
        <div className={lang === 'en' ? 'flex flex-col gap-5' : 'hidden'}>{en}</div>
      </FieldLangContext>
    </div>
  )
}

// Hitung galat per bahasa dari nama field berakhiran _id / _en.
export function countLangErrors(errors: Record<string, unknown>) {
  const keys = Object.keys(errors)
  return {
    id: keys.filter((k) => k.endsWith('_id')).length,
    en: keys.filter((k) => k.endsWith('_en')).length,
  }
}
