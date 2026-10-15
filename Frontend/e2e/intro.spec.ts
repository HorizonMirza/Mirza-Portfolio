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

  const results = await new AxeBuilder({ page })
    .include('dialog.intro')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])

  await dialog.getByRole('button', { name: 'Beranda' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/id$/)
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
