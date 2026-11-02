import { describe, expect, it } from 'vitest'

import { ORPHAN_MAX_PER_RUN, pickOrphans } from '@/lib/orphan-uploads'

const now = Date.UTC(2026, 10, 2, 12)
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString()

// audit 2026-11-02, DB-07: hanya berkas lama tanpa baris Asset di folder situs yang dihapus
describe('pickOrphans', () => {
  it('memilih berkas di folder situs yang tidak tercatat dan lebih tua dari 48 jam', () => {
    const remote = [
      { publicId: 'portfolio/projects/yatim', createdAt: hoursAgo(72), resourceType: 'image' },
      { publicId: 'portfolio/projects/dipakai', createdAt: hoursAgo(72), resourceType: 'image' },
      { publicId: 'portfolio/projects/baru', createdAt: hoursAgo(2), resourceType: 'image' },
      { publicId: 'lain/berkas', createdAt: hoursAgo(72), resourceType: 'image' },
      { publicId: 'portfolio/cv/cv.pdf', createdAt: 'bukan tanggal', resourceType: 'raw' },
    ] as const
    const picked = pickOrphans(remote, new Set(['portfolio/projects/dipakai']), now)
    expect(picked.map((r) => r.publicId)).toEqual(['portfolio/projects/yatim'])
  })
  it('paling banyak sejumlah batas per run', () => {
    const remote = Array.from({ length: ORPHAN_MAX_PER_RUN + 10 }, (_, i) => ({
      publicId: `portfolio/x/${i}`,
      createdAt: hoursAgo(100),
      resourceType: 'image' as const,
    }))
    expect(pickOrphans(remote, new Set(), now)).toHaveLength(ORPHAN_MAX_PER_RUN)
  })
})
