import { describe, expect, it } from 'vitest'

import { initials, semesterNumber } from '@/features/experience/schema'

const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

describe('semesterNumber', () => {
  it('Sep 2024 → Okt 2026 = semester 5', () => {
    expect(semesterNumber('2024-09', at('2026-10-05'))).toBe(5)
  })

  it('bulan yang sama = semester 1', () => {
    expect(semesterNumber('2026-09', at('2026-09-20'))).toBe(1)
  })

  it('naik tiap 6 bulan', () => {
    expect(semesterNumber('2025-01', at('2025-06-30'))).toBe(1)
    expect(semesterNumber('2025-01', at('2025-07-01'))).toBe(2)
    expect(semesterNumber('2025-01', at('2026-01-01'))).toBe(3)
  })

  it('tanggal mulai di masa depan tidak menghasilkan angka di bawah 1', () => {
    expect(semesterNumber('2027-01', at('2026-10-05'))).toBe(1)
  })
})

describe('initials', () => {
  it('mengambil dua huruf awal tanpa "PT" dan tanpa bagian setelah koma', () => {
    expect(initials('PT PGAS Solution')).toBe('PS')
    expect(initials('Student Support, BINUS University')).toBe('SS')
    expect(initials('BINUS University')).toBe('BU')
  })

  it('jatuh ke dua huruf pertama bila tidak ada kata berhuruf besar', () => {
    expect(initials('algo')).toBe('AL')
  })
})
