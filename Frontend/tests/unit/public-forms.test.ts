import { beforeEach, describe, expect, it, vi } from 'vitest'

// Server Action publik diuji dengan database, header, rate limit, dan email tiruan.
const db = {
  message: { create: vi.fn(async () => ({ id: 'msg-1' })) },
  subscriber: {
    findUnique: vi.fn(async (): Promise<unknown> => null),
    create: vi.fn(async () => ({ id: '01a0f218-0209-7656-a356-02d34f1c52c3' })),
    update: vi.fn(async () => ({ id: '01a0f218-0209-7656-a356-02d34f1c52c3' })),
  },
}
const rate = { allowed: true }
const sendEmail = vi.fn(async () => undefined)
let emailConfig: unknown = null

vi.mock('@/lib/db', () => ({ getDb: () => db }))
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' }),
}))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/lib/email', () => ({ getEmailConfig: () => emailConfig, sendEmail }))
vi.mock('@/lib/rate-limit', () => ({
  consumePublicRateLimit: vi.fn(async () => ({
    allowed: rate.allowed,
    retryAfter: rate.allowed ? null : 60,
  })),
  hashIdentifier: (v: string) => `hash(${v.length})`,
}))

const { submitContact } = await import('@/features/messages/public-actions')
const { subscribeNewsletter, confirmSubscription, unsubscribe } =
  await import('@/features/subscribers/public-actions')
const { unsubscribeToken } = await import('@/features/subscribers/tokens')

function form(values: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(values)) fd.set(k, v)
  return fd
}

const idle = { status: 'idle' as const }
const validContact = {
  name: 'Rina',
  email: 'rina@example.com',
  subject: '',
  message: 'Halo, pesan ini cukup panjang.',
  locale: 'id',
}

beforeEach(() => {
  vi.clearAllMocks()
  rate.allowed = true
  emailConfig = null
  db.subscriber.findUnique.mockResolvedValue(null)
})

describe('submitContact', () => {
  it('honeypot terisi: dibalas berhasil tanpa menyimpan', async () => {
    const r = await submitContact(idle, form({ ...validContact, website: 'http://spam' }))
    expect(r.status).toBe('success')
    expect(db.message.create).not.toHaveBeenCalled()
  })
  it('galat per kolom berupa kunci terjemahan dan isian dikembalikan', async () => {
    const r = await submitContact(idle, form({ ...validContact, email: 'x', message: 'pendek' }))
    expect(r).toMatchObject({
      status: 'error',
      message: 'invalid',
      fieldErrors: { email: 'emailInvalid', message: 'messageShort' },
    })
    expect(r.values?.email).toBe('x')
  })
  it('rate limit', async () => {
    rate.allowed = false
    expect(await submitContact(idle, form(validContact))).toMatchObject({
      status: 'error',
      message: 'rateLimited',
    })
    expect(db.message.create).not.toHaveBeenCalled()
  })
  it('menyimpan pesan dengan hash IP, bukan IP mentah', async () => {
    const r = await submitContact(idle, form(validContact))
    expect(r.status).toBe('success')
    const data = (
      db.message.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    )[0].data
    expect(data).toMatchObject({
      name: 'Rina',
      email: 'rina@example.com',
      subject: null,
      locale: 'id',
    })
    expect(JSON.stringify(data)).not.toContain('203.0.113.9')
    expect(sendEmail).not.toHaveBeenCalled()
  })
  it('notifikasi email bila Resend diatur, gagal kirim tidak menggagalkan pengunjung', async () => {
    emailConfig = {
      RESEND_API_KEY: 'x',
      EMAIL_FROM: 'a@b.c',
      CONTACT_TO_EMAIL: 'owner@example.com',
    }
    sendEmail.mockRejectedValueOnce(new Error('down'))
    const r = await submitContact(idle, form(validContact))
    expect(r.status).toBe('success')
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@example.com', replyTo: 'rina@example.com' }),
    )
  })
})

describe('subscribeNewsletter', () => {
  it('belum aktif tanpa Resend dan tidak menyimpan apa pun', async () => {
    const r = await subscribeNewsletter(idle, form({ email: 'a@example.com', locale: 'id' }))
    expect(r).toMatchObject({ status: 'error', message: 'unavailable' })
    expect(db.subscriber.create).not.toHaveBeenCalled()
  })
  it('pendaftar baru disimpan PENDING dengan hash token, email konfirmasi dikirim', async () => {
    emailConfig = { RESEND_API_KEY: 'x', EMAIL_FROM: 'a@b.c' }
    const r = await subscribeNewsletter(idle, form({ email: 'Baru@Example.com', locale: 'en' }))
    expect(r.status).toBe('success')
    const data = (
      db.subscriber.create.mock.calls[0] as unknown as [{ data: Record<string, string> }]
    )[0].data
    expect(data.email).toBe('baru@example.com')
    expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/)
    const sent = (
      sendEmail.mock.calls[0] as unknown as [{ html: string; headers: Record<string, string> }]
    )[0]
    expect(sent.html).toContain('/en/newsletter/confirm?token=')
    expect(sent.html).not.toContain(data.tokenHash)
    expect(sent.headers['List-Unsubscribe']).toContain('/en/newsletter/unsubscribe?token=')
  })
  it('email yang sudah terkonfirmasi mendapat jawaban sama tanpa email baru (tidak bisa ditebak)', async () => {
    emailConfig = { RESEND_API_KEY: 'x', EMAIL_FROM: 'a@b.c' }
    db.subscriber.findUnique.mockResolvedValueOnce({ id: 'x', status: 'CONFIRMED' })
    expect(
      (await subscribeNewsletter(idle, form({ email: 'a@example.com', locale: 'id' }))).status,
    ).toBe('success')
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('konfirmasi dan berhenti langganan', () => {
  it('token konfirmasi tak dikenal ditolak', async () => {
    expect(await confirmSubscription(idle, form({ token: 'x'.repeat(43) }))).toEqual({
      status: 'invalid',
    })
  })
  it('token PENDING dikonfirmasi lalu diganti agar hanya sekali pakai', async () => {
    db.subscriber.findUnique.mockResolvedValueOnce({ id: 's1', status: 'PENDING' })
    expect(await confirmSubscription(idle, form({ token: 'y'.repeat(43) }))).toEqual({
      status: 'confirmed',
    })
    const data = (
      db.subscriber.update.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    )[0].data
    expect(data).toMatchObject({ status: 'CONFIRMED' })
    expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })
  it('tanda tangan berhenti langganan diverifikasi', async () => {
    const id = '01a0f218-0209-7656-a356-02d34f1c52c3'
    expect(await unsubscribe(idle, form({ token: unsubscribeToken(id) }))).toEqual({
      status: 'unsubscribed',
    })
    expect(await unsubscribe(idle, form({ token: `${id}.palsu` }))).toEqual({ status: 'invalid' })
  })
})
