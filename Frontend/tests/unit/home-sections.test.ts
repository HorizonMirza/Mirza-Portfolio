import { describe, expect, it, vi } from 'vitest'

import { experienceSchema } from '@/features/experience/schema'
import { highlightSchema } from '@/features/highlights/schema'

vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

describe('angka beranda', () => {
  const valid = {
    value: 1000,
    suffix: '+',
    label_id: 'anggota di Reclub',
    label_en: 'members on Reclub',
    source: 'Ace Padel Club',
    order: 1,
    status: 'PUBLISHED',
  }
  it('angka valid diterima', () => {
    expect(highlightSchema.safeParse(valid).success).toBe(true)
  })
  it('angka kosong, negatif, pecahan, atau keterangan kosong ditolak', () => {
    for (const bad of [
      { value: Number.NaN },
      { value: -1 },
      { value: 1.5 },
      { label_en: ' ' },
      { suffix: 'terlalu panjang' },
    ])
      expect(highlightSchema.safeParse({ ...valid, ...bad }).success).toBe(false)
  })
})

describe('garis cerita', () => {
  it('centang garis cerita bawaannya mati', () => {
    const parsed = experienceSchema.parse({
      type: 'WORK',
      organization: 'Ace Padel Club',
      title_id: 'Founder',
      title_en: 'Founder',
      description_id: '- a',
      description_en: '- a',
      startMonth: '2025-05',
      endMonth: '',
      location: '',
      employmentType: '',
      status: 'PUBLISHED',
    })
    expect(parsed.inStory).toBe(false)
  })
})
