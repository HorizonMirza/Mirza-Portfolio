import { APIError } from 'better-auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Ganti nama dan email di Admin → Akun meminta password akun (revisi pemilik 2026-11-16).
const verifyPasswordApi = vi.fn()
vi.mock('@backend/lib/auth', () => ({
  getAuth: () => ({ api: { verifyPassword: verifyPasswordApi } }),
}))
vi.mock('@backend/lib/auth-guard', () => ({
  requireSuperAdmin: async () => ({
    userId: '01a0f218-0209-7656-a356-02d34f1c52c3',
    name: 'Nama Lama',
    email: 'lama@contoh.com',
  }),
}))
vi.mock('@backend/lib/rate-limit', () => ({
  consumeRateLimit: async () => ({ allowed: true, retryAfter: null }),
  hashIdentifier: (v: string) => v,
}))
const writeAudit = vi.fn<(db: unknown, entry: unknown) => Promise<void>>(async () => undefined)
vi.mock('@backend/lib/audit', () => ({ writeAudit }))
const userUpdate = vi.fn(async () => ({}))
const userFind = vi.fn(async (): Promise<{ id: string } | null> => null)
vi.mock('@backend/lib/db', () => ({
  getDb: () => ({
    user: { findUnique: userFind },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ user: { update: userUpdate } }),
  }),
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

const { changeAccountEmail, renameAccount } = await import('@backend/features/account/actions')

const wrongPassword = () =>
  APIError.from('BAD_REQUEST', { code: 'INVALID_PASSWORD', message: 'Invalid password' })

beforeEach(() => {
  verifyPasswordApi.mockReset()
  userUpdate.mockClear()
  userFind.mockReset()
  userFind.mockResolvedValue(null)
  writeAudit.mockClear()
})

describe('renameAccount', () => {
  it('password salah ditandai di kolomnya dan nama tidak berubah', async () => {
    verifyPasswordApi.mockRejectedValueOnce(wrongPassword())
    const r = await renameAccount({ name: 'Nama Baru', password: 'salah' })
    expect(r).toMatchObject({ ok: false, fieldErrors: { password: 'Password salah' } })
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('tanpa password ditolak sebelum menyentuh database', async () => {
    const r = await renameAccount({ name: 'Nama Baru', password: '' })
    expect(r).toMatchObject({ ok: false })
    expect(verifyPasswordApi).not.toHaveBeenCalled()
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('password benar menyimpan nama dan menulis audit', async () => {
    verifyPasswordApi.mockResolvedValueOnce({ status: true })
    const r = await renameAccount({ name: '  Nama Baru  ', password: 'benar' })
    expect(r).toMatchObject({ ok: true })
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: '01a0f218-0209-7656-a356-02d34f1c52c3' },
      data: { name: 'Nama Baru' },
    })
    expect(writeAudit).toHaveBeenCalledTimes(1)
  })
})

describe('changeAccountEmail', () => {
  it('password salah ditandai di kolomnya dan email tidak berubah', async () => {
    verifyPasswordApi.mockRejectedValueOnce(wrongPassword())
    const r = await changeAccountEmail({ email: 'baru@contoh.com', password: 'salah' })
    expect(r).toMatchObject({ ok: false, fieldErrors: { password: 'Password salah' } })
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('email tidak valid ditolak', async () => {
    const r = await changeAccountEmail({ email: 'bukan-email', password: 'benar' })
    expect(r).toMatchObject({ ok: false, fieldErrors: { email: 'Format email tidak valid' } })
    expect(verifyPasswordApi).not.toHaveBeenCalled()
  })

  it('email yang dipakai akun lain ditolak', async () => {
    verifyPasswordApi.mockResolvedValueOnce({ status: true })
    userFind.mockResolvedValueOnce({ id: 'akun-lain' })
    const r = await changeAccountEmail({ email: 'dipakai@contoh.com', password: 'benar' })
    expect(r).toMatchObject({ ok: false, fieldErrors: { email: 'Email sudah dipakai' } })
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('email baru disimpan huruf kecil dan audit hanya memuat email yang disamarkan', async () => {
    verifyPasswordApi.mockResolvedValueOnce({ status: true })
    const r = await changeAccountEmail({ email: ' Baru@Contoh.com ', password: 'benar' })
    expect(r).toMatchObject({ ok: true })
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: '01a0f218-0209-7656-a356-02d34f1c52c3' },
      data: { email: 'baru@contoh.com' },
    })
    const entry = JSON.stringify(writeAudit.mock.calls[0]?.[1])
    expect(entry).not.toContain('baru@contoh.com')
    expect(entry).not.toContain('lama@contoh.com')
    expect(entry).toContain('••')
  })

  it('email yang sama dengan sekarang tidak menulis apa pun', async () => {
    verifyPasswordApi.mockResolvedValueOnce({ status: true })
    const r = await changeAccountEmail({ email: 'LAMA@contoh.com', password: 'benar' })
    expect(r).toMatchObject({ ok: true })
    expect(userUpdate).not.toHaveBeenCalled()
  })
})
