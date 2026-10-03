import { expect, test, type Browser } from '@playwright/test'

async function openRootWithLocale(browser: Browser, locale: string) {
  const context = await browser.newContext({ locale })
  const page = await context.newPage()
  await page.goto('/')
  return { context, page }
}

test('browser berbahasa Indonesia diarahkan ke /id', async ({ browser }) => {
  const { context, page } = await openRootWithLocale(browser, 'id-ID')
  await expect(page).toHaveURL(/\/id$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Mahasiswa AI BINUS yang membangun software dan komunitas.',
  )
  await context.close()
})

test('browser berbahasa Inggris diarahkan ke /en', async ({ browser }) => {
  const { context, page } = await openRootWithLocale(browser, 'en-US')
  await expect(page).toHaveURL(/\/en$/)
  await context.close()
})

test('bahasa lain jatuh ke bahasa bawaan /id', async ({ browser }) => {
  const { context, page } = await openRootWithLocale(browser, 'fr-FR')
  await expect(page).toHaveURL(/\/id$/)
  await context.close()
})

test('tombol bahasa berpindah ke versi Inggris di halaman yang sama', async ({ page }) => {
  await page.goto('/id/experience')
  await page.getByRole('link', { name: 'Ganti bahasa ke English (EN)' }).click()
  await expect(page).toHaveURL(/\/en\/experience$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Experience')
  // tombol yang sama kembali ke bahasa Indonesia
  await page.getByRole('link', { name: 'Switch language to Bahasa Indonesia (ID)' }).click()
  await expect(page).toHaveURL(/\/id\/experience$/)
})

test('satu tombol tema membalik gelap dan terang, lalu tersimpan', async ({ page }) => {
  await page.goto('/id')
  const html = page.locator('html')
  const toggle = page.getByRole('button', { name: 'Mode gelap' })

  // tampilan awal gelap (keputusan pemilik M4)
  await expect(html).toHaveClass(/dark/)
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  await toggle.click()
  await expect(html).toHaveClass(/light/)
  await expect(html).not.toHaveClass(/dark/)
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await page.reload()
  await expect(html).toHaveClass(/light/)
  await toggle.click()
  await expect(html).toHaveClass(/dark/)
})

test('tautan lewati konten muncul saat difokus dengan keyboard', async ({ page }) => {
  await page.goto('/id')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Lewati ke konten utama' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
})

// WebKit mencatat prefetch RSC yang dibatalkan karena pindah halaman sebagai error
// "due to access control checks". Itu bukan kegagalan aplikasi.
const abortedPrefetch = /\?_rsc=\S+ due to access control checks\.$/

test('tidak ada error di console', async ({ page, browserName }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (browserName === 'webkit' && abortedPrefetch.test(message.text())) return
    errors.push(message.text())
  })
  page.on('pageerror', (error) => {
    // di WebKit prefetch yang dibatalkan kadang muncul sebagai pageerror, bukan console
    if (browserName === 'webkit' && abortedPrefetch.test(error.message)) return
    errors.push(error.message)
  })
  await page.goto('/id')
  await page.getByRole('button', { name: 'Mode gelap' }).click()
  for (const path of [
    '/en',
    '/en/about',
    '/en/experience',
    '/en/projects',
    '/en/contact',
    '/en/privacy',
  ]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  expect(errors).toEqual([])
})

// URL /admin/* tanpa sesi diarahkan ke login (e2e/admin/access.spec.ts).
for (const path of ['/id/halaman-yang-tidak-ada', '/en/missing-page']) {
  test(`URL tidak dikenal ${path} menampilkan 404 dua bahasa`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Halaman tidak ditemukan')
    await expect(page.getByText('Page not found')).toBeVisible()
    await expect(page.getByRole('link', { name: /Beranda/ })).toHaveAttribute('href', '/id')
  })
}
