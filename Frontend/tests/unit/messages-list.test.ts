// Tes unit: listMessages.

import { beforeEach, describe, expect, it, vi } from 'vitest'

// daftar pesan tidak mengambil isi pesan penuh
const queryRaw = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(async () => [])
vi.mock('server-only', () => ({}))
vi.mock('@backend/lib/db', () => ({ getDb: () => ({ $queryRaw: queryRaw }) }))

const { listMessages, MESSAGE_PREVIEW_CHARS, MESSAGES_PAGE_SIZE } =
  await import('@backend/features/messages/queries')

describe('listMessages', () => {
  beforeEach(() => queryRaw.mockClear())

  it('memotong isi pesan di database, satu karakter lebih dari cuplikan', async () => {
    await listMessages('NEW', 1)
    const [strings, ...values] = queryRaw.mock.calls[0] as [TemplateStringsArray, ...unknown[]]
    const sql = strings.join('?')
    expect(sql).toContain('left("body", ?::int) AS "body"')
    expect(sql).not.toMatch(/"subject",\s*"body"/)
    expect(values).toContain(MESSAGE_PREVIEW_CHARS + 1)
  })

  it('status dan halaman dikirim sebagai parameter, bukan disambung ke teks query', async () => {
    await listMessages('ARCHIVED', 3)
    const [strings, ...values] = queryRaw.mock.calls[0] as [TemplateStringsArray, ...unknown[]]
    expect(strings.join('?')).not.toContain('ARCHIVED')
    expect(values).toEqual([MESSAGE_PREVIEW_CHARS + 1, 'ARCHIVED', MESSAGES_PAGE_SIZE, 100])
  })
})
