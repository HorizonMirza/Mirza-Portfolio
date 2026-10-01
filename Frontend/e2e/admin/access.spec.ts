import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { hasAdminEnv, login, uniqueIp } from './helpers'

test.describe('akses admin tanpa sesi', () => {
  for (const path of [
    '/admin',
    '/admin/projects',
    '/admin/messages/01a0f218-0209-7656-a356-02d34f1c52c3',
    '/admin/belum-ada',
  ]) {
    test(`${path} diarahkan ke login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(
        new RegExp(`/admin/login\\?next=${encodeURIComponent(path).replace(/%2F/g, '(%2F|/)')}`),
      )
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }

  test('halaman login tidak diindeks', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('cookie sesi palsu ditolak', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'mm.session_token', value: 'palsu.palsu', url: baseURL! }])
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('pendaftaran akun baru dimatikan', async ({ request, baseURL }) => {
    const res = await request.post('/api/auth/sign-up/email', {
      headers: { origin: baseURL!, 'x-forwarded-for': uniqueIp() },
      data: { email: 'penyusup@example.com', password: 'password-panjang-sekali', name: 'X' },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })

  test('rate limit login: percobaan ke-6 dari IP yang sama ditolak 429', async ({
    request,
    baseURL,
  }) => {
    const ip = uniqueIp()
    const attempt = () =>
      request.post('/api/auth/sign-in/email', {
        headers: { origin: baseURL!, 'x-forwarded-for': ip },
        data: { email: 'bukan-admin@example.com', password: 'password-salah-sekali' },
      })
    for (let i = 0; i < 5; i++) expect((await attempt()).status()).toBe(401)
    expect((await attempt()).status()).toBe(429)
    // IP lain tidak ikut terblokir
    const other = await request.post('/api/auth/sign-in/email', {
      headers: { origin: baseURL!, 'x-forwarded-for': uniqueIp() },
      data: { email: 'bukan-admin@example.com', password: 'password-salah-sekali' },
    })
    expect(other.status()).toBe(401)
  })
})

test.describe('login dan logout', () => {
  test.skip(!hasAdminEnv, 'butuh ADMIN_EMAIL dan ADMIN_PASSWORD')
  test.use({ extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() } })

  test('password salah menampilkan pesan umum', async ({ page }) => {
    await login(page, process.env.ADMIN_EMAIL, 'password-yang-salah-sekali')
    await expect(page.locator('#login-error')).toHaveText('Incorrect email or password.')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('login, kembali ke halaman tujuan, lalu logout', async ({ page, isMobile }) => {
    await page.goto('/admin/skills')
    await expect(page).toHaveURL(/next=/)
    await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL!)
    await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD!)
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page).toHaveURL(/\/admin\/skills$/)
    if (isMobile) await page.getByRole('button', { name: /menu/i }).click()
    await page.getByRole('button', { name: 'Keluar' }).click()
    await expect(page).toHaveURL(/\/admin\/login/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})

test.describe('tampilan halaman login', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  for (const theme of ['light', 'dark']) {
    test(`selalu hitam walau tema ${theme}, tanpa pelanggaran aksesibilitas dan CSP`, async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text())
      })
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
      await page.goto('/admin/login')
      await expect(page.getByRole('heading', { name: 'Welcome Back King!' })).toBeVisible()
      await expect(page.locator('main').locator('..')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
      // tombol lihat sandi membuka dan menutup isi kolom password
      const password = page.getByLabel('Password', { exact: true })
      await expect(password).toHaveAttribute('type', 'password')
      await page.getByRole('button', { name: 'Show password' }).click()
      await expect(password).toHaveAttribute('type', 'text')
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
      expect(errors).toEqual([])
    })
  }
})
