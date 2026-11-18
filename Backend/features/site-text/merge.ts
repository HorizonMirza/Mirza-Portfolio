// Menimpa pesan bawaan (messages/*.json) dengan teks hasil suntingan admin.
// Murni (tanpa database) supaya mudah diuji. Hanya namespace yang berubah yang disalin.

type Messages = Record<string, unknown>

export type TextOverride = { key: string; value_id: string | null; value_en: string | null }

export function applyTextOverrides(
  messages: Messages,
  overrides: readonly TextOverride[],
  locale: string,
): Messages {
  let out = messages
  const copied = new Set<string>()
  for (const row of overrides) {
    const value = locale === 'en' ? row.value_en : row.value_id
    if (!value) continue
    const dot = row.key.indexOf('.')
    if (dot < 1) continue
    const ns = row.key.slice(0, dot)
    const name = row.key.slice(dot + 1)
    const current = messages[ns]
    // jangan menambah kunci baru: hanya teks yang memang ada di berkas bawaan
    if (
      typeof current !== 'object' ||
      current === null ||
      typeof (current as Messages)[name] !== 'string'
    )
      continue
    if (out === messages) out = { ...messages }
    if (!copied.has(ns)) {
      out[ns] = { ...(current as Messages) }
      copied.add(ns)
    }
    ;(out[ns] as Messages)[name] = value
  }
  return out
}
