import { expect, type Page, test, type Browser } from '@playwright/test'

// Di HP, pilihan bahasa dan tema ada di dalam menu.
async function openControls(page: Page, isMobile: boolean, label = 'Buka menu') {
  if (isMobile) await page.getByRole('button', { name: label }).click()
}

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

test('pengganti bahasa berpindah ke versi Inggris di halaman yang sama', async ({
  page,
  isMobile,
}) => {
  await page.goto('/id/experience')
  await openControls(page, isMobile)
  await page
    .getByRole('navigation', { name: 'Bahasa' })
    .getByRole('link', { name: 'English' })
    .click()
  await expect(page).toHaveURL(/\/en\/experience$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Experience & Education')
})

test('tema gelap dan terang bisa dipilih dan tersimpan', async ({ page, isMobile }) => {
  await page.goto('/id')
  await openControls(page, isMobile)
  const html = page.locator('html')
  const group = page.getByRole('group', { name: 'Tema' })

  await group.getByRole('button', { name: 'Gelap' }).click()
  await expect(html).toHaveClass(/dark/)
  await expect(group.getByRole('button', { name: 'Gelap' })).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await expect(html).toHaveClass(/dark/)
  await openControls(page, isMobile)

  await group.getByRole('button', { name: 'Terang' }).click()
  await expect(html).toHaveClass(/light/)
  await expect(html).not.toHaveClass(/dark/)
})

test('tautan lewati konten muncul saat difokus dengan keyboard', async ({ page }) => {
  await page.goto('/id')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Lewati ke konten utama' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
})

test('tidak ada error di console', async ({ page, isMobile }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/id')
  await openControls(page, isMobile)
  await page.getByRole('button', { name: 'Gelap' }).click()
  for (const path of [
    '/en',
    '/en/about',
    '/en/experience',
    '/en/skills',
    '/en/projects',
    '/en/contact',
    '/en/privacy',
  ]) {
    await page.goto(path)
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
