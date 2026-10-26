import 'server-only'

import { getDb } from '@/lib/db'

import { entriesOf, type ModuleId } from './catalog'
import type { SiteTextsInput } from './schema'

// Nilai tersimpan untuk formulir admin. Kunci tanpa suntingan berisi string kosong.
export async function getTextsForEdit(moduleId: ModuleId): Promise<SiteTextsInput> {
  const entries = entriesOf(moduleId)
  const rows = await getDb().siteText.findMany({
    where: { key: { in: entries.map((entry) => entry.key) } },
  })
  const byKey = new Map(rows.map((row) => [row.key, row]))
  const values: SiteTextsInput['values'] = {}
  for (const entry of entries) {
    const row = byKey.get(entry.key)
    values[entry.key] = { id: row?.value_id ?? '', en: row?.value_en ?? '' }
  }
  return { values }
}

type Messages = Record<string, Record<string, unknown>>

// Teks bawaan dari messages/*.json, ditampilkan sebagai placeholder agar admin tahu apa yang berlaku
// bila isian dikosongkan.
export async function getDefaultTexts(
  moduleId: ModuleId,
): Promise<Record<string, { id: string; en: string }>> {
  const [id, en] = await Promise.all([
    import('../../../messages/id.json').then((m) => m.default as Messages),
    import('../../../messages/en.json').then((m) => m.default as Messages),
  ])
  const read = (messages: Messages, key: string) => {
    const dot = key.indexOf('.')
    const value = messages[key.slice(0, dot)]?.[key.slice(dot + 1)]
    return typeof value === 'string' ? value : ''
  }
  return Object.fromEntries(
    entriesOf(moduleId).map((entry) => [
      entry.key,
      { id: read(id, entry.key), en: read(en, entry.key) },
    ]),
  )
}
