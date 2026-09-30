import { describe, expect, it } from 'vitest'

import en from '../../messages/en.json'
import id from '../../messages/id.json'

// Kumpulkan semua kunci bersarang, misalnya "Home.title".
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object')
      Object.assign(acc, flatten(value as Record<string, unknown>, path))
    else acc[path] = value
    return acc
  }, {})
}

describe('berkas terjemahan', () => {
  const flatId = flatten(id)
  const flatEn = flatten(en)

  it('kunci ID dan EN sama persis', () => {
    expect(Object.keys(flatEn).sort()).toEqual(Object.keys(flatId).sort())
  })

  it('tidak ada teks kosong', () => {
    for (const [key, value] of Object.entries({ ...flatId, ...flatEn })) {
      expect(typeof value, key).toBe('string')
      expect((value as string).trim(), key).not.toBe('')
    }
  })
})
