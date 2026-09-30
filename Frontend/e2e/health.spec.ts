import { expect, test } from '@playwright/test'

test('endpoint health melaporkan database terhubung', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toContain('no-store')
  const body = await response.json()
  expect(body).toMatchObject({ status: 'ok', database: 'ok' })
})
