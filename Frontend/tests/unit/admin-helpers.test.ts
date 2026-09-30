import { describe, expect, it } from 'vitest'

import { Prisma } from '@/generated/prisma/client'
import { toActionError, uniqueViolationFields, zodFieldErrors } from '@/lib/action-result'
import { diffSnapshots } from '@/lib/audit'
import { UnauthorizedError } from '@/lib/auth-guard'
import { moveItem } from '@/lib/reorder'
import { safeAdminRedirect } from '@/lib/safe-redirect'

describe('moveItem', () => {
  const ids = ['a', 'b', 'c']
  it('menukar dengan tetangga', () => {
    expect(moveItem(ids, 'b', 'up')).toEqual(['b', 'a', 'c'])
    expect(moveItem(ids, 'b', 'down')).toEqual(['a', 'c', 'b'])
  })
  it('null di ujung daftar atau id tidak ada', () => {
    expect(moveItem(ids, 'a', 'up')).toBeNull()
    expect(moveItem(ids, 'c', 'down')).toBeNull()
    expect(moveItem(ids, 'x', 'up')).toBeNull()
  })
  it('tidak mengubah array asli', () => {
    moveItem(ids, 'b', 'up')
    expect(ids).toEqual(['a', 'b', 'c'])
  })
})

describe('diffSnapshots', () => {
  it('hanya field yang berubah, tanpa createdAt/updatedAt', () => {
    const diff = diffSnapshots(
      { title: 'A', year: 2025, updatedAt: new Date(1) },
      { title: 'B', year: 2025, updatedAt: new Date(2) },
    )
    expect(diff).toEqual({ title: { before: 'A', after: 'B' } })
  })
  it('memotong teks panjang dan mengubah tanggal jadi ISO', () => {
    const diff = diffSnapshots(null, {
      body: 'x'.repeat(1000),
      at: new Date('2026-01-01T00:00:00Z'),
    })
    expect((diff.body!.after as string).length).toBeLessThanOrEqual(301)
    expect(diff.at!.after).toBe('2026-01-01T00:00:00.000Z')
  })
  it('create dan delete mencatat semua field', () => {
    expect(Object.keys(diffSnapshots({ a: 1, b: 2 }, null))).toEqual(['a', 'b'])
  })
})

describe('uniqueViolationFields', () => {
  it('format lama meta.target', () => {
    expect(uniqueViolationFields({ target: ['slug'] })).toEqual(['slug'])
  })
  it('driver adapter dengan nama indeks', () => {
    const meta = { driverAdapterError: { cause: { constraint: { index: 'Skill_name_key' } } } }
    expect(uniqueViolationFields(meta)).toEqual(['name'])
  })
  it('driver adapter dengan daftar kolom', () => {
    const meta = { driverAdapterError: { cause: { constraint: { fields: ['email'] } } } }
    expect(uniqueViolationFields(meta)).toEqual(['email'])
  })
  it('kosong bila tidak dikenali', () => {
    expect(uniqueViolationFields(undefined)).toEqual([])
  })
})

describe('toActionError', () => {
  it('sesi habis', () => {
    expect(toActionError(new UnauthorizedError())).toMatchObject({
      ok: false,
      message: expect.stringMatching(/Sesi/),
    })
  })
  it('galat unik dipetakan ke field', () => {
    const error = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { driverAdapterError: { cause: { constraint: { index: 'Project_slug_key' } } } },
    })
    expect(toActionError(error, { slug: 'Slug' })).toEqual({
      ok: false,
      message: 'Data sudah dipakai.',
      fieldErrors: { slug: 'Slug sudah dipakai' },
    })
  })
  it('galat lain tidak membocorkan detail', () => {
    const r = toActionError(new Error('connection refused 10.0.0.5:5432'))
    expect(r.message).not.toContain('10.0.0.5')
  })
})

describe('zodFieldErrors', () => {
  it('pesan pertama per field', () => {
    expect(
      zodFieldErrors([
        { path: ['a'], message: 'satu' },
        { path: ['a'], message: 'dua' },
        { path: ['socials', 'github'], message: 'url' },
      ]),
    ).toEqual({ a: 'satu', 'socials.github': 'url' })
  })
})

describe('safeAdminRedirect', () => {
  it.each([
    [undefined, '/admin'],
    ['/admin/projects', '/admin/projects'],
    ['https://jahat.example/admin', '/admin'],
    ['//jahat.example', '/admin'],
    ['/admin\\@jahat', '/admin'],
    ['/admin/login?next=/admin', '/admin'],
    ['/id', '/admin'],
  ])('%s → %s', (input, expected) => {
    expect(safeAdminRedirect(input)).toBe(expected)
  })
})
