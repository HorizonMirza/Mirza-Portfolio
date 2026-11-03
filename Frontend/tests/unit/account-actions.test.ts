import { APIError } from 'better-auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changePasswordApi = vi.fn()
vi.mock('@/lib/auth', () => ({ getAuth: () => ({ api: { changePassword: changePasswordApi } }) }))
vi.mock('@/lib/auth-guard', () => ({
  requireSuperAdmin: async () => ({ userId: '01a0f218-0209-7656-a356-02d34f1c52c3' }),
}))
vi.mock('@/lib/rate-limit', () => ({
  consumeRateLimit: async () => ({ allowed: true, retryAfter: null }),
  hashIdentifier: (v: string) => v,
}))
vi.mock('@/lib/audit', () => ({ writeAudit: vi.fn(async () => undefined) }))
vi.mock('@/lib/db', () => ({ getDb: () => ({}) }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

const { changePassword } = await import('@/features/account/actions')

const input = {
  currentPassword: 'password-lama-panjang',
  newPassword: 'password-baru-yang-panjang',
  confirmPassword: 'password-baru-yang-panjang',
}

// audit 2026-11-03, ERR-05: galat Better Auth dibedakan, tidak semuanya "password salah"
describe('changePassword', () => {
  beforeEach(() => changePasswordApi.mockReset())

  it('password saat ini salah ditandai di kolomnya', async () => {
    changePasswordApi.mockRejectedValueOnce(
      APIError.from('BAD_REQUEST', { code: 'INVALID_PASSWORD', message: 'Invalid password' }),
    )
    expect(await changePassword(input)).toMatchObject({
      ok: false,
      fieldErrors: { currentPassword: 'Password saat ini salah' },
    })
  })
  it('sesi berakhir tidak disebut password salah', async () => {
    changePasswordApi.mockRejectedValueOnce(new APIError('UNAUTHORIZED'))
    const r = await changePassword(input)
    expect(r).toMatchObject({ ok: false, message: expect.stringMatching(/Sesi berakhir/) })
    expect(JSON.stringify(r)).not.toContain('Password saat ini salah')
  })
  it('galat lain memberi pesan umum', async () => {
    changePasswordApi.mockRejectedValueOnce(new APIError('INTERNAL_SERVER_ERROR'))
    expect(await changePassword(input)).toMatchObject({
      ok: false,
      message: expect.stringMatching(/gagal diganti/),
    })
  })
})
