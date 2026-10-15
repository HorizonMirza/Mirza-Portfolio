import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Pemberitahuan pembuka (DESIGN.md bagian 53). Situs menyembunyikannya untuk browser otomatis
// (navigator.webdriver), jadi tes ini berpura-pura sebagai pengunjung biasa.
// Tanpa animasi: kartu yang masih masuk (transparan dan bergeser) membuat cek kontras salah baca dan
// klik di Firefox meleset (CI 2026-10-12).
test.use({ contextOptions: { reducedMotion: 'reduce' } })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
  })
})

test('muncul sekali saat situs dibuka, tombol Beranda menutup dan membuka beranda', async ({
  page,
}) => {
  await page.goto('/id/about')
  const dialog = page.getByRole('dialog', { name: 'Informasi Penting' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Beranda' })).toBeVisible()
  // latar neural vortex (seperti login admin) hanya terpasang selama kartu terbuka
  await expect(page.locator('dialog.intro canvas')).toHaveCount(1)

  const results = await new AxeBuilder({ page })
    .include('dialog.intro')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])

  await dialog.getByRole('button', { name: 'Beranda' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/id$/)
  await expect(page.locator('dialog.intro canvas')).toHaveCount(0)
  await page.goto('/id/projects')
  // beri waktu efek klien berjalan; pemberitahuan tetap tertutup
  await page.waitForTimeout(800)
  await expect(page.locator('dialog.intro')).toBeHidden()
})

test('ID/EN mengganti bahasa kartu tanpa pindah halaman, bahasa situs ikut setelah ditutup', async ({
  page,
}) => {
  await page.goto('/id/projects')
  const dialog = page.locator('dialog.intro')
  await expect(page.getByRole('dialog', { name: 'Informasi Penting' })).toBeVisible()
  await dialog.getByRole('button', { name: 'EN' }).click()
  await expect(page.getByRole('dialog', { name: 'Important Information' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Home' })).toBeVisible()
  // halaman di belakang belum berganti bahasa
  await expect(page).toHaveURL(/\/id\/projects$/)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/en\/projects$/)
})

test.describe('dengan animasi', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('Beranda: vortex terhisap ke tombol, layar hitam memudar ke Home', async ({ page }) => {
    await page.goto('/id/about')
    const dialog = page.getByRole('dialog', { name: 'Informasi Penting' })
    await expect(dialog).toBeVisible()
    // tunggu animasi masuk kartu selesai agar tombol diam saat diklik
    await page.waitForTimeout(900)
    await dialog.getByRole('button', { name: 'Beranda' }).click()
    // layar hitam dipasang setelah vortex dan kartu terhisap (± 1,15 detik)
    await expect(page.locator('.intro-veil')).toHaveCount(1)
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/id$/)
    // layar hitam memudar lalu lapisannya dilepas
    await expect(page.locator('.intro-veil')).toHaveCount(0, { timeout: 8000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
