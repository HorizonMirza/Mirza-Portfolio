'use client'

import { useState } from 'react'

import type { AssetView } from '@/features/assets/components/asset-panels'

import { saveExperience } from '../actions'
import { experienceSchema, type ExperienceInput } from '../schema'

export type EntryRow = {
  // id untuk entri tersimpan, "new-n" untuk entri baru yang belum disimpan
  key: string
  id: string | null
  values: ExperienceInput
  logo: AssetView | null
  photo: AssetView | null
}

export type EntryErrors = Record<string, string>

const snap = (v: ExperienceInput) => JSON.stringify(v)

// Teks dua bahasa yang wajib: bila satu bahasa kosong, salin dari bahasa lain dulu (bisa diubah
// kemudian lewat ID/EN), supaya entri baru bisa disimpan setelah diisi dalam satu bahasa.
function fillOtherLanguage(v: ExperienceInput): ExperienceInput {
  const next = { ...v }
  for (const f of ['title', 'description'] as const) {
    const id = (next[`${f}_id`] ?? '').trim()
    const en = (next[`${f}_en`] ?? '').trim()
    if (!id && en) next[`${f}_id`] = en
    if (!en && id) next[`${f}_en`] = id
  }
  return next
}

// Daftar entri pengalaman/pendidikan yang diubah langsung di halaman (DESIGN.md bagian 147): tiap
// entri menyimpan nilainya sendiri; Simpan menyimpan semua entri yang berubah sekaligus. Data baru
// dari server (setelah router.refresh) diambil untuk entri yang tidak sedang diubah.
export function useEntries(initial: EntryRow[]) {
  const [rows, setRows] = useState(initial)
  const [saved, setSaved] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((r) => [r.key, snap(r.values)])),
  )
  const [errors, setErrors] = useState<Record<string, EntryErrors>>({})
  const [source, setSource] = useState(initial)
  const [counter, setCounter] = useState(0)

  // data server berubah: entri yang belum diubah ikut data baru, entri yang sedang diubah dan entri
  // baru yang belum tersimpan tetap
  if (source !== initial) {
    setSource(initial)
    const dirty = new Map(
      rows.filter((r) => snap(r.values) !== saved[r.key]).map((r) => [r.key, r]),
    )
    const fresh = initial.map((r) => {
      const local = dirty.get(r.key)
      return local ? { ...r, values: local.values } : r
    })
    const pendingNew = rows.filter((r) => r.id === null)
    setRows([...pendingNew, ...fresh])
    setSaved((s) => ({ ...s, ...Object.fromEntries(initial.map((r) => [r.key, snap(r.values)])) }))
  }

  const isDirty = (r: EntryRow) => r.id === null || snap(r.values) !== saved[r.key]

  function update(key: string, patch: Partial<ExperienceInput>) {
    setRows((list) =>
      list.map((r) => (r.key === key ? { ...r, values: { ...r.values, ...patch } } : r)),
    )
    setErrors((e) => {
      if (!e[key]) return e
      const rest = { ...e[key] }
      for (const f of Object.keys(patch)) delete rest[f]
      return { ...e, [key]: rest }
    })
  }

  function add(values: ExperienceInput, atEnd = false) {
    const key = `new-${counter}`
    setCounter((c) => c + 1)
    const row: EntryRow = { key, id: null, values, logo: null, photo: null }
    setRows((list) => (atEnd ? [...list, row] : [row, ...list]))
    return key
  }

  function discard(key: string) {
    setRows((list) => list.filter((r) => r.key !== key))
    setErrors((e) => {
      const { [key]: _drop, ...rest } = e
      void _drop
      return rest
    })
  }

  // Simpan semua entri yang berubah. Hasil: jumlah tersimpan dan jumlah gagal (galat per isian
  // disimpan di errors).
  async function saveAll(): Promise<{ saved: number; failed: number }> {
    let ok = 0
    let failed = 0
    const nextErrors: Record<string, EntryErrors> = {}
    for (const row of rows.filter(isDirty)) {
      const values = fillOtherLanguage(row.values)
      const parsed = experienceSchema.safeParse(values)
      if (!parsed.success) {
        failed++
        nextErrors[row.key] = Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0] ?? ''), i.message]),
        )
        continue
      }
      const result = await saveExperience(row.id, values)
      if (!result.ok || !result.data) {
        failed++
        const fields = !result.ok ? result.fieldErrors : undefined
        nextErrors[row.key] =
          fields && Object.keys(fields).length > 0 ? fields : { _: result.message }
        continue
      }
      ok++
      const id = result.data.id
      // entri baru mendapat id: kuncinya ikut id agar cocok dengan data server berikutnya
      setRows((list) => list.map((r) => (r.key === row.key ? { ...r, key: id, id, values } : r)))
      setSaved((s) => ({ ...s, [id]: snap(values) }))
    }
    setErrors(nextErrors)
    return { saved: ok, failed }
  }

  return {
    rows,
    errors,
    update,
    add,
    discard,
    saveAll,
    dirty: rows.some(isDirty),
  }
}
