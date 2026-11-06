import { beforeEach, describe, expect, it, vi } from 'vitest'

// Server Action publik diuji dengan database, header, rate limit, dan email tiruan.
const db = {
  message: { create: vi.fn(async () => ({ id: 'msg-1' })) },
}
const rate = { allowed: true }
const sendEmail = vi.fn(async () => undefined)
let emailConfig: unknown = null

vi.mock('@/lib/db', () => ({ getDb: () => db }))
// after() menjalankan tugas setelah jawaban terkirim; di tes dikumpulkan lalu ditunggu
const afterTasks: Promise<unknown>[] = []
vi.mock('next/server', () => ({
  after: (task: () => unknown) => {
    afterTasks.push(Promise.resolve().then(task))
  },
}))
const flushAfter = () => Promise.all(afterTasks.splice(0))
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
    await flushAfter()
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@example.com', replyTo: 'rina@example.com' }),
    )
  })
  it('baris baru di nama tidak ikut ke subjek email notifikasi', async () => {
    emailConfig = {
      RESEND_API_KEY: 'x',
      EMAIL_FROM: 'a@b.c',
      CONTACT_TO_EMAIL: 'owner@example.com',
    }
    const r = await submitContact(
      idle,
      form({ ...validContact, name: 'Rina\r\nBcc: korban@example.com\u0007' }),
    )
    expect(r.status).toBe('success')
    await flushAfter()
    const calls = sendEmail.mock.calls as unknown as [{ subject: string }][]
    const sent = calls.at(-1)![0]
    expect(sent.subject).toBe('Pesan baru: Rina Bcc: korban@example.com')
    expect(sent.subject).not.toMatch(/[\r\n]/)
  })
  it('nama yang hanya berisi karakter kontrol ditolak sebagai kosong', async () => {
    const r = await submitContact(idle, form({ ...validContact, name: '\n\t\u0000' }))
    expect(r).toMatchObject({ status: 'error', fieldErrors: { name: 'nameRequired' } })
  })
})
