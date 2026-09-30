import { expect, test } from '@playwright/test'

import { uniqueIp } from './admin/helpers'

test('beranda: tombol utama terlihat tanpa scroll dan tiap bagian bernomor', async ({ page }) => {
  await page.goto('/id')
  await expect(page.getByRole('link', { name: 'Lihat project' })).toBeInViewport()
  await expect(page.getByRole('heading', { name: 'Perjalanan terbaru' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Kabar project baru' })).toBeVisible()
})

test('menu HP membuka navigasi dan menutup setelah pindah halaman', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'khusus HP')
  await page.goto('/id')
  await page.getByRole('button', { name: 'Buka menu' }).click()
  const menu = page.locator('#site-menu')
  await expect(menu).toBeVisible()
  await menu.getByRole('link', { name: 'Pengalaman' }).click()
  await expect(page).toHaveURL(/\/id\/experience$/)
  await expect(menu).toBeHidden()
  // Esc juga menutup menu (perilaku bawaan popover)
  await page.getByRole('button', { name: 'Buka menu' }).click()
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
})

test('filter pengalaman hanya menampilkan jenis yang dipilih', async ({ page }) => {
  await page.goto('/id/experience')
  const items = page.locator('ol > li[data-type]')
  const total = await items.count()
  expect(total).toBeGreaterThan(1)
  await page.locator('fieldset').getByText('Pendidikan', { exact: true }).click()
  await expect(page.locator('li[data-type="EDUCATION"]').first()).toBeVisible()
  await expect(page.locator('li[data-type="WORK"]').first()).toBeHidden()
  await page.locator('fieldset').getByText('Semua', { exact: true }).click()
  await expect(page.locator('li[data-type="WORK"]').first()).toBeVisible()
})

test('halaman project tanpa project terbit menampilkan keadaan kosong atau kartu', async ({
  page,
}) => {
  const response = await page.goto('/en/projects')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
})

test('detail project yang tidak ada mengembalikan 404', async ({ page }) => {
  const response = await page.goto('/id/projects/tidak-ada-sama-sekali')
  expect(response?.status()).toBe(404)
})

test.describe('form kontak', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() } })

  test('validasi di server tampil per kolom dan isian tidak hilang', async ({ page }) => {
    await page.goto('/id/contact')
    await page.getByLabel('Nama').fill('Tamu E2E')
    await page.getByLabel('Email').fill('bukan-email')
    await page.getByLabel('Pesan').fill('pendek')
    await page.getByRole('button', { name: 'Kirim pesan' }).click()
    await expect(page.getByText('Format email tidak valid')).toBeVisible()
    await expect(page.getByText('Pesan minimal 10 karakter')).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Periksa kembali' })).toBeFocused()
    await expect(page.getByLabel('Nama')).toHaveValue('Tamu E2E')
  })

  test('pesan valid tersimpan dan pengunjung mendapat konfirmasi', async ({ page }, testInfo) => {
    await page.goto('/en/contact')
    await page.getByLabel('Name').fill(`E2E visitor ${testInfo.project.name}`)
    await page.getByLabel('Email').fill('visitor@example.com')
    await page.getByLabel('Message').fill('Hello, this is an automated end-to-end test message.')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByRole('status')).toContainText('your message is in')
  })
})

test('form kontak berfungsi tanpa JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() },
  })
  const page = await context.newPage()
  await page.goto(`${baseURL}/id/contact`)
  await page.getByLabel('Nama').fill('Tanpa JS')
  await page.getByLabel('Email').fill('nojs@example.com')
  await page.getByLabel('Pesan').fill('Pesan ini dikirim tanpa JavaScript.')
  await page.getByRole('button', { name: 'Kirim pesan' }).click()
  await expect(page.getByText('pesan Anda sudah masuk')).toBeVisible()
  await context.close()
})

test('rate limit kontak: pesan ke-6 dalam satu jam ditolak', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() } })
  const page = await context.newPage()
  for (let i = 0; i < 6; i++) {
    await page.goto(`${baseURL}/id/contact`)
    await page.getByLabel('Nama').fill(`Rate ${i}`)
    await page.getByLabel('Email').fill('rate@example.com')
    await page.getByLabel('Pesan').fill('Pesan uji rate limit nomor ' + i)
    await page.getByRole('button', { name: 'Kirim pesan' }).click()
    if (i < 5) await expect(page.getByText('pesan Anda sudah masuk')).toBeVisible()
  }
  await expect(page.getByText('Terlalu banyak pesan dari jaringan ini')).toBeVisible()
  await context.close()
})

test('newsletter tanpa Resend menampilkan pesan belum aktif', async ({ page }) => {
  test.skip(Boolean(process.env.RESEND_API_KEY), 'Resend aktif')
  await page.goto('/id')
  const form = page.getByRole('region', { name: 'Kabar project baru' })
  await form.getByLabel('Email').fill('pembaca@example.com')
  await form.getByRole('button', { name: 'Berlangganan' }).click()
  await expect(form.getByText('Newsletter belum aktif')).toBeVisible()
})

test('tautan konfirmasi newsletter tidak langsung mengubah data dan token palsu ditolak', async ({
  page,
}) => {
  await page.goto('/id/newsletter/confirm?token=token-palsu-yang-cukup-panjang-12345')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Konfirmasi langganan' }).click()
  await expect(page.getByText('Tautan tidak berlaku')).toBeVisible()
})

test.describe('route handler publik', () => {
  test('API v1 read-only dengan kontrak { data, meta } dan CORS', async ({ request }) => {
    for (const path of [
      '/api/v1/projects',
      '/api/v1/skills?locale=en',
      '/api/v1/profile?locale=id',
    ]) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      expect(res.headers()['access-control-allow-origin']).toBe('*')
      expect(res.headers()['cache-control']).toContain('s-maxage')
      const body = await res.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('meta')
    }
    const profile = await (await request.get('/api/v1/profile')).json()
    expect(profile.data).not.toHaveProperty('email')
    expect(profile.data).not.toHaveProperty('whatsapp')
    const missing = await request.get('/api/v1/projects/tidak-ada')
    expect(missing.status()).toBe(404)
    expect(await missing.json()).toEqual({
      error: { code: 'NOT_FOUND', message: expect.any(String) },
    })
    const write = await request.post('/api/v1/projects', { data: {} })
    expect(write.status()).toBe(405)
  })

  test('beacon kunjungan menerima permintaan situs sendiri dan menolak isi aneh', async ({
    request,
  }) => {
    const ok = await request.post('/api/track', {
      headers: { 'sec-fetch-site': 'same-origin', 'user-agent': 'Mozilla/5.0 Chrome/140' },
      data: { path: '/projects', locale: 'id', referrer: null },
    })
    expect(ok.status()).toBe(204)
    const bad = await request.post('/api/track', {
      headers: { 'sec-fetch-site': 'same-origin', 'user-agent': 'Mozilla/5.0 Chrome/140' },
      data: { path: '<script>alert(1)</script>', locale: 'id' },
    })
    expect(bad.status()).toBe(400)
  })

  test('cron harian menolak tanpa CRON_SECRET', async ({ request }) => {
    const res = await request.get('/api/cron/daily')
    expect(res.status()).toBe(401)
  })

  test('unduh CV tanpa berkas diarahkan ke halaman Tentang', async ({ request }) => {
    const res = await request.get('/api/cv?locale=en', { maxRedirects: 0 })
    expect([302, 303]).toContain(res.status())
  })
})

test('header keamanan ada dan tidak ada pelanggaran CSP di halaman publik', async ({
  page,
  request,
}) => {
  const res = await request.get('/id')
  const h = res.headers()
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')

  const violations: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|CSP/i.test(m.text()))
      violations.push(m.text())
  })
  for (const path of ['/id', '/en/about', '/id/experience', '/en/projects', '/id/contact']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle').catch(() => undefined)
  }
  expect(violations).toEqual([])
})

test('sitemap, robots, dan gambar Open Graph tersedia', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  const xml = await sitemap.text()
  expect(xml).toContain('/id/experience')
  expect(xml).toContain('hreflang="en"')
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Disallow: /admin')
  const og = await request.get('/en/opengraph-image')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toContain('image/png')
})

test('beranda memuat data terstruktur Person tanpa email atau WhatsApp', async ({ page }) => {
  await page.goto('/id')
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
  const data = JSON.parse(raw ?? '{}')
  expect(data['@type']).toBe('Person')
  expect(JSON.stringify(data)).not.toMatch(/whatsapp|mailto|@gmail/i)
})

test('tema awal gelap untuk pengunjung baru', async ({ page }) => {
  await page.goto('/id')
  await expect(page.locator('html')).toHaveClass(/dark/)
})
