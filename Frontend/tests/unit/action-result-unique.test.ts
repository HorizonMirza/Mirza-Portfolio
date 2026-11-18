import { describe, expect, it, vi } from 'vitest'

import { Prisma } from '@backend/generated/prisma/client'

vi.mock('@backend/lib/auth-guard', () => ({ UnauthorizedError: class extends Error {} }))

const { toActionError } = await import('@backend/lib/action-result')

// bentuk galat unik dari Prisma 7 dengan driver adapter: hanya nama indeks yang diketahui
function uniqueError(index: string) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { constraint: { index } } } },
  })
}

// audit 2026-11-17, DB-04: ganti email yang bentrok ditandai di isian Email, bukan pesan umum
describe('toActionError untuk bentrok email', () => {
  it('menandai isian Email bila label diberikan', () => {
    expect(toActionError(uniqueError('User_email_key'), { email: 'Email' })).toEqual({
      ok: false,
      message: 'Data sudah dipakai.',
      fieldErrors: { email: 'Email sudah dipakai' },
    })
  })

  it('tanpa label tetap pesan umum', () => {
    expect(toActionError(uniqueError('User_email_key'))).toMatchObject({
      ok: false,
      message: 'Data yang sama sudah ada.',
    })
  })
})
