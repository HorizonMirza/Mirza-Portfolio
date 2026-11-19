// Tes unit src/features/github/sample dan src/lib/contributions-pack: contributions-pack.

import { describe, expect, it } from 'vitest'

import { sampleContributions } from '@/features/github/sample'
import { packContributions, type PackedDay, unpackContributions } from '@/lib/contributions-pack'

// kalender seperti GitHub: minggu pertama bisa kurang dari 7 hari, minggu terakhir juga
function calendar(firstWeek: number, total: number): PackedDay[][] {
  const base = sampleContributions(new Date('2026-11-18T00:00:00Z')).slice(0, total)
  const days: PackedDay[] = base.map((d, i) => ({
    date: d.date,
    count: d.count,
    level: (i % 5) as PackedDay['level'],
  }))
  const weeks: PackedDay[][] = [days.slice(0, firstWeek)]
  for (let i = firstWeek; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

describe('contributions-pack', () => {
  it('pack lalu unpack mengembalikan data yang sama persis', () => {
    for (const [first, total] of [
      [7, 371],
      [3, 370],
      [1, 365],
      [5, 12],
    ] as const) {
      const weeks = calendar(first, total)
      const packed = packContributions(weeks)
      expect(packed).not.toBeNull()
      expect(unpackContributions(packed!)).toEqual(weeks)
    }
  })

  it('jauh lebih kecil daripada JSON per hari', () => {
    const weeks = calendar(4, 371)
    const packed = packContributions(weeks)!
    expect(JSON.stringify(packed).length).toBeLessThan(JSON.stringify(weeks).length / 5)
  })

  it('mengembalikan null bila hari tidak berurutan atau minggu tidak wajar', () => {
    const weeks = calendar(7, 60)
    const gap = weeks.map((w) => [...w])
    gap[2].splice(1, 1)
    expect(packContributions(gap)).toBeNull()
    expect(packContributions([])).toBeNull()
    const longMiddle = calendar(7, 60)
    longMiddle[1] = longMiddle[1].slice(0, 5)
    expect(packContributions(longMiddle)).toBeNull()
  })
})
