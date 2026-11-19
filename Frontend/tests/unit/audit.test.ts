// Tes unit Backend/lib/audit: diffSnapshots untuk kolom JSON berupa objek, writeAudit.

import { describe, expect, it, vi } from 'vitest'

import { diffSnapshots, writeAudit } from '@backend/lib/audit'

// kolom JSON berupa objek dan jejak perubahan yang ringkas
const mix = { nav: 100, theme: 100, slide: 100, lanyard: 100 }

describe('diffSnapshots untuk kolom JSON berupa objek', () => {
  it('hanya kunci yang berubah yang disalin, bukan seluruh objek', () => {
    const diff = diffSnapshots({ soundMix: mix }, { soundMix: { ...mix, nav: 90 } })
    expect(diff).toEqual({ soundMix: { before: { nav: 100 }, after: { nav: 90 } } })
  })
  it('kunci yang ditambah atau dihapus dicatat dengan null di sisi lainnya', () => {
    const diff = diffSnapshots({ socials: { a: 'x' } }, { socials: { a: 'x', b: 'y' } })
    expect(diff).toEqual({ socials: { before: { b: null }, after: { b: 'y' } } })
  })
  it('array dan nilai biasa tetap disalin utuh', () => {
    const diff = diffSnapshots(
      { palette: ['#1', '#2'], on: false },
      { palette: ['#1', '#3'], on: true },
    )
    expect(diff).toEqual({
      palette: { before: ['#1', '#2'], after: ['#1', '#3'] },
      on: { before: false, after: true },
    })
  })
})

describe('writeAudit', () => {
  const entry = { actorId: 'a', entity: 'Profile', entityId: '1' }
  const tx = () => {
    const create = vi.fn(async () => undefined)
    return { tx: { auditLog: { create } } as never, create }
  }

  it('update tanpa perubahan tidak menulis baris', async () => {
    const { tx: t, create } = tx()
    await writeAudit(t, { ...entry, action: 'update', before: { name: 'A' }, after: { name: 'A' } })
    expect(create).not.toHaveBeenCalled()
  })
  it('update yang mengubah sesuatu menulis satu baris', async () => {
    const { tx: t, create } = tx()
    await writeAudit(t, { ...entry, action: 'update', before: { name: 'A' }, after: { name: 'B' } })
    expect(create).toHaveBeenCalledTimes(1)
  })
  it('create dan delete selalu ditulis', async () => {
    const { tx: t, create } = tx()
    await writeAudit(t, { ...entry, action: 'create', before: null, after: {} })
    await writeAudit(t, { ...entry, action: 'delete', before: {}, after: null })
    expect(create).toHaveBeenCalledTimes(2)
  })
})
