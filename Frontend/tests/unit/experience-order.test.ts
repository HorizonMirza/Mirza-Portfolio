import { describe, expect, it } from 'vitest'

import { sortByLatest } from '@/features/experience/schema'

// Tanggal dari CV (Database/seed/seed-data.ts), tanpa pendidikan.
const items = [
  { name: 'PGAS', start: '2026-07', end: null },
  { name: 'Freshmen Partner', start: '2025-08', end: '2026-01' },
  { name: 'Algo Bootcamp', start: '2025-07', end: '2025-09' },
  { name: 'Ace Padel Club', start: '2025-05', end: '2026-04' },
  { name: 'Horizon Organizer', start: '2023-05', end: '2023-10' },
  { name: 'Reader Ambassador', start: '2022-02', end: '2023-01' },
  { name: 'Warnet Mobile', start: '2021-01', end: '2022-12' },
]

describe('sortByLatest', () => {
  it('menaruh yang masih berjalan di atas, lalu yang paling akhir selesai', () => {
    expect(sortByLatest(items).map((i) => i.name)).toEqual([
      'PGAS',
      'Ace Padel Club',
      'Freshmen Partner',
      'Algo Bootcamp',
      'Horizon Organizer',
      'Reader Ambassador',
      'Warnet Mobile',
    ])
  })

  it('bulan selesai sama: yang mulai lebih akhir di atas, dan tidak mengubah array asal', () => {
    const same = [
      { start: '2024-01', end: '2025-06' },
      { start: '2024-09', end: '2025-06' },
      { start: '2025-01', end: null },
      { start: '2023-01', end: null },
    ]
    const copy = structuredClone(same)
    expect(sortByLatest(same)).toEqual([
      { start: '2025-01', end: null },
      { start: '2023-01', end: null },
      { start: '2024-09', end: '2025-06' },
      { start: '2024-01', end: '2025-06' },
    ])
    expect(same).toEqual(copy)
  })
})
