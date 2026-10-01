import { describe, expect, it, vi } from 'vitest'

import { buildEnvelope, parseDsn, parseStack, reportServerError } from '@/lib/error-report'

const DSN = 'https://abc123@o42.ingest.us.sentry.io/4507'

describe('parseDsn', () => {
  it('membentuk endpoint envelope dari DSN', () => {
    expect(parseDsn(DSN)).toEqual({
      endpoint: 'https://o42.ingest.us.sentry.io/api/4507/envelope/',
      publicKey: 'abc123',
      dsn: DSN,
    })
  })

  it('mempertahankan prefix path', () => {
    expect(parseDsn('https://k@sentry.example.com/sub/7')?.endpoint).toBe(
      'https://sentry.example.com/sub/api/7/envelope/',
    )
  })

  it('menolak DSN tanpa kunci atau project', () => {
    expect(parseDsn('https://o42.ingest.sentry.io/4507')).toBeNull()
    expect(parseDsn('https://k@o42.ingest.sentry.io/')).toBeNull()
    expect(parseDsn('bukan url')).toBeNull()
  })
})

describe('parseStack', () => {
  it('mengubah stack V8 menjadi frame, terlama dulu', () => {
    const stack = [
      'Error: gagal',
      '    at load (/var/task/app/page.js:10:5)',
      '    at /var/task/server.js:3:1',
      '    bukan baris stack',
    ].join('\n')
    expect(parseStack(stack)).toEqual([
      { function: '<anonymous>', filename: '/var/task/server.js', lineno: 3, colno: 1 },
      { function: 'load', filename: '/var/task/app/page.js', lineno: 10, colno: 5 },
    ])
  })

  it('stack kosong menjadi daftar kosong', () => {
    expect(parseStack(undefined)).toEqual([])
  })
})

describe('buildEnvelope', () => {
  const target = parseDsn(DSN)!
  const options = {
    target,
    environment: 'production',
    release: 'abc',
    eventId: 'e'.repeat(32),
    now: new Date('2026-10-01T00:00:00Z'),
  }

  it('tidak mengirim query string, header, atau data permintaan lain', () => {
    const envelope = buildEnvelope(
      Object.assign(new Error('rusak'), { digest: '123' }),
      { path: '/id/newsletter/confirm?token=rahasia', method: 'GET' },
      { routeType: 'render', routePath: '/[locale]/newsletter/confirm' },
      options,
    )
    const [header, item, body] = envelope
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    expect(header).toMatchObject({ event_id: options.eventId, dsn: DSN })
    expect(item).toEqual({ type: 'event' })
    expect(body.request).toEqual({ method: 'GET', url: '/id/newsletter/confirm' })
    expect(body.exception.values[0]).toMatchObject({ type: 'Error', value: 'rusak' })
    expect(body.extra).toEqual({ digest: '123' })
    expect(body.transaction).toBe('/[locale]/newsletter/confirm')
    expect(envelope).not.toContain('rahasia')
  })

  it('nilai bukan Error tetap terlaporkan dan pesan dipotong', () => {
    const envelope = buildEnvelope('x'.repeat(5000), { path: '/', method: 'POST' }, {}, options)
    const body = JSON.parse(envelope.trim().split('\n')[2])
    expect(body.exception.values[0].value).toHaveLength(1000)
  })
})

describe('reportServerError', () => {
  it('tidak mengirim apa pun tanpa SENTRY_DSN', async () => {
    const send = vi.fn()
    await reportServerError(new Error('x'), { path: '/', method: 'GET' }, {}, {}, send)
    expect(send).not.toHaveBeenCalled()
  })

  it('mengirim envelope ke Sentry dengan header autentikasi', async () => {
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    await reportServerError(
      new Error('x'),
      { path: '/id', method: 'GET' },
      { routeType: 'render' },
      { SENTRY_DSN: DSN, VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_SHA: 'abc' },
      send,
    )
    expect(send).toHaveBeenCalledOnce()
    const [url, init] = send.mock.calls[0]
    expect(url).toBe('https://o42.ingest.us.sentry.io/api/4507/envelope/')
    expect(init.headers['X-Sentry-Auth']).toContain('sentry_key=abc123')
    expect(init.body).toContain('"release":"abc"')
  })

  it('gagal mengirim tidak melempar error', async () => {
    const send = vi.fn().mockRejectedValue(new Error('jaringan'))
    await expect(
      reportServerError(
        new Error('x'),
        { path: '/', method: 'GET' },
        {},
        { SENTRY_DSN: DSN },
        send,
      ),
    ).resolves.toBeUndefined()
  })
})
