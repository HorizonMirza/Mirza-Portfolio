import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Pemberitahuan pembuka (DESIGN.md bagian 53). Situs menyembunyikannya untuk browser otomatis
// (navigator.webdriver), jadi tes ini berpura-pura sebagai pengunjung biasa.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
  })
})

test('muncul sekali saat situs dibuka, tidak muncul lagi saat pindah halaman', async ({ page }) => {
  await page.goto('/id')
  const dialog = page.getByRole('dialog', { name: 'Sebelum masuk' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Lihat project' })).toBeVisible()

  const results = await new AxeBuilder({ page })
    .include('dialog.intro')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])

  await dialog.getByRole('button', { name: 'Masuk ke situs' }).click()
  await expect(dialog).toBeHidden()
  await page.goto('/id/about')
  // beri waktu efek klien berjalan; pemberitahuan tetap tertutup
  await page.waitForTimeout(800)
  await expect(page.locator('dialog.intro')).toBeHidden()
  await page.reload()
  await page.waitForTimeout(800)
  await expect(page.locator('dialog.intro')).toBeHidden()
})

test('Esc menutup, bahasa bisa diganti dari dalam pemberitahuan', async ({ page }) => {
  await page.goto('/id/projects')
  const dialog = page.getByRole('dialog', { name: 'Sebelum masuk' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('link', { name: 'EN' }).click()
  await expect(page).toHaveURL(/\/en\/projects$/)
  const english = page.getByRole('dialog', { name: 'Before you enter' })
  await expect(english).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(english).toBeHidden()
})
