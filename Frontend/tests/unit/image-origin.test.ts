// Tes unit src/features/skills/image-origin: isCrossOrigin.

import { describe, expect, it } from 'vitest'

import { isCrossOrigin } from '@/features/skills/image-origin'

const page = 'https://mmirza.site/id'

describe('isCrossOrigin', () => {
  it('berkas satu situs, relatif maupun mutlak, bukan domain lain', () => {
    expect(isCrossOrigin('/skills/react.webp', page)).toBe(false)
    expect(isCrossOrigin('https://mmirza.site/skills/react.webp', page)).toBe(false)
  })
  it('Cloudinary dan domain lain termasuk domain lain', () => {
    expect(isCrossOrigin('https://res.cloudinary.com/demo/image/upload/a.webp', page)).toBe(true)
    expect(isCrossOrigin('http://mmirza.site/a.webp', page)).toBe(true)
  })
  it('data: dan blob: tidak mencemari kanvas', () => {
    expect(isCrossOrigin('data:image/svg+xml;charset=utf-8,%3Csvg%3E', page)).toBe(false)
    expect(isCrossOrigin('blob:https://mmirza.site/1234', page)).toBe(false)
  })
  it('alamat rusak dianggap bukan domain lain (jalur lama tetap dipakai)', () => {
    expect(isCrossOrigin('http://', page)).toBe(false)
  })
})
