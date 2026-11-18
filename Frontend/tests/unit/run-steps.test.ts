import { describe, expect, it, vi } from 'vitest'

import { runSteps } from '@backend/lib/run-steps'

// audit 2026-11-17, ERR-01: satu langkah gagal tidak menghentikan langkah lain
describe('runSteps', () => {
  it('menjalankan semua langkah dan menggabungkan hasilnya', async () => {
    const r = await runSteps(
      { a: async () => ({ x: 1 }), b: async () => ({ y: 2, z: 3 }) },
      vi.fn(),
    )
    expect(r).toEqual({ data: { x: 1, y: 2, z: 3 }, failed: [] })
  })

  it('langkah yang gagal dicatat dan langkah berikutnya tetap jalan', async () => {
    const onError = vi.fn()
    const after = vi.fn(async () => ({ y: 2 }))
    const r = await runSteps(
      {
        a: async () => {
          throw new Error('database mati')
        },
        b: after,
      },
      onError,
    )
    expect(r).toEqual({ data: { y: 2 }, failed: ['a'] })
    expect(after).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith('a', expect.objectContaining({ message: 'database mati' }))
  })

  it('galat di pelapor tidak menghentikan langkah berikutnya', async () => {
    const after = vi.fn(async () => ({ y: 2 }))
    const r = await runSteps(
      {
        a: async () => {
          throw new Error('x')
        },
        b: after,
      },
      async () => {
        throw new Error('pelapor mati')
      },
    )
    expect(r.failed).toEqual(['a'])
    expect(after).toHaveBeenCalledOnce()
  })
})
