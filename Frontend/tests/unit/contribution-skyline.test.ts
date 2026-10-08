import { describe, expect, it } from 'vitest'

import {
  barHeight,
  buildGrid,
  camera,
  computeStats,
  dayMs,
  levelOf,
  monthLabels,
  riseAt,
} from '@/components/ui/contribution-skyline'

describe('contribution-skyline', () => {
  it('tanggal "YYYY-MM-DD" dibaca tanpa geser zona waktu', () => {
    expect(new Date(dayMs('2026-10-08')).toISOString()).toBe('2026-10-08T00:00:00.000Z')
  })

  it('grid berakhir di hari terakhir, dimulai hari Minggu, dan menjumlahkan tanggal ganda', () => {
    const end = dayMs('2026-10-08')
    const grid = buildGrid(
      [
        { date: '2026-10-08', count: 2 },
        { date: '2026-10-08', count: 3 },
        { date: 'bukan-tanggal', count: 9 },
        { date: '2026-10-07', count: -4 },
      ],
      end,
    )
    const first = grid.cells[0]
    const last = grid.cells[grid.cells.length - 1]
    expect(new Date(dayMs(first.date)).getUTCDay()).toBe(0)
    expect(last.date).toBe('2026-10-08')
    expect(last.count).toBe(5)
    expect(grid.max).toBe(5)
    expect(grid.cells.every((c) => c.day === new Date(dayMs(c.date)).getUTCDay())).toBe(true)
    expect(grid.weeks).toBe(last.week + 1)
  })

  it('level 0 untuk hari kosong, 4 untuk hari sesibuk persentil 95 atau lebih', () => {
    expect(levelOf(0, 10)).toBe(0)
    expect(levelOf(1, 10)).toBe(1)
    expect(levelOf(5, 10)).toBe(3)
    expect(levelOf(10, 10)).toBe(4)
    expect(levelOf(40, 10)).toBe(4)
  })

  it('statistik: total, hari tersibuk, rentetan terpanjang, rentetan yang sampai kemarin', () => {
    const data = [
      { date: '2026-10-01', count: 1 },
      { date: '2026-10-02', count: 4 },
      { date: '2026-10-03', count: 1 },
      { date: '2026-10-06', count: 2 },
      { date: '2026-10-07', count: 1 },
    ]
    // hari terakhir (8 Okt) kosong: belum selesai, jadi rentetan saat ini tetap 6-7 Okt
    const stats = computeStats(buildGrid(data, dayMs('2026-10-08')).cells)
    expect(stats.total).toBe(9)
    expect(stats.busiest).toEqual({ count: 4, date: '2026-10-02' })
    expect(stats.longest).toEqual({ days: 3, start: '2026-10-01', end: '2026-10-03' })
    expect(stats.current).toEqual({ days: 2, start: '2026-10-06', end: '2026-10-07' })
  })

  it('label bulan memakai bahasa situs dan membuang bulan awal yang terpotong', () => {
    const grid = buildGrid([], dayMs('2026-10-08'))
    const labels = monthLabels(grid.cells, grid.weeks, 'id-ID').map((m) => m.label)
    expect(labels.at(-1)).toBe('Okt')
    expect(labels).toContain('Agu')
    expect(labels.length).toBeLessThanOrEqual(13)
  })

  it('batang datar di awal morph, penuh di akhir; kamera 2D lurus dari atas', () => {
    expect(riseAt(0, 0, 53, 0)).toBe(0)
    expect(riseAt(1, 52, 53, 6)).toBe(1)
    expect(barHeight(0, 10)).toBe(0.2)
    expect(barHeight(10, 10)).toBeCloseTo(7.6)
    const flat = camera(0)
    expect(flat.cs).toBeCloseTo(1)
    expect(flat.sn).toBeCloseTo(0)
    expect(flat.ce).toBeCloseTo(0)
  })
})
