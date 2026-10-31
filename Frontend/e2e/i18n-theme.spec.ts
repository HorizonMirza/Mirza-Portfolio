import { expect, test, type Browser } from '@playwright/test'

import { waitForFiniteAnimations } from './wait'

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
  // hero hanya berisi nama dan foto (revisi 2026-10-19); bahasa terlihat dari judul bagian
  await expect(page.getByRole('heading', { name: 'Keahlian Teknis' })).toBeVisible()
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

test('ganti bahasa tidak membuat tema berkedip', async ({ browser }) => {
  // Laporan pemilik 2026-10-21: saat ganti bahasa React memasang ulang atribut <html> dan kelas tema
  // sempat hilang sampai next-themes memasangnya lagi. Tiap perubahan atribut <html> dicatat; saat
  // pencatat berjalan (setelah commit React selesai) kelas tema harus sudah kembali.
  // Tiap tema memakai konteks baru: memakai ulang satu halaman membuat iterasi kedua di Firefox
  // menggantung menunggu navigasi (CI 2026-10-30, dua kali di langkah klik yang sama).
  for (const theme of ['dark', 'light'] as const) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.addInitScript((t) => localStorage.setItem('mmirza-theme', t), theme)
    await page.goto('/id/about')
    await page.evaluate((t) => {
      const w = window as unknown as { __themeLost: number }
      w.__themeLost = 0
      new MutationObserver(() => {
        if (!document.documentElement.classList.contains(t)) w.__themeLost++
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    }, theme)
    const switcher = page.locator('header a[hreflang]')
    await switcher.click()
    await expect(page).toHaveURL(/\/en\/about$/)
    // kedipan tema terjadi saat halaman baru hidrasi: tunggu semua skrip termuat dan animasi selesai
    await page.waitForLoadState('networkidle')
    await waitForFiniteAnimations(page)
    const lost = await page.evaluate(
      () => (window as unknown as { __themeLost: number }).__themeLost,
    )
    expect(lost, `kelas ${theme} hilang saat ganti bahasa`).toBe(0)
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
    await context.close()
  }
})

test('pengunjung dengan pilihan tema lama tetap mulai dari gelap', async ({ browser }) => {
  // kunci penyimpanan baru (2026-10-21): pilihan lama 'theme' diabaikan, dan tema tidak ikut sistem
  const context = await browser.newContext({ colorScheme: 'light' })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await page.goto('/id')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await context.close()
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
// URL tak dikenal di bawah /id atau /en: 404 dalam bahasa URL itu saja, satu tombol ke beranda,
// tanpa terjemahan dan tanpa penjelasan 404 (revisi pemilik 2026-10-18).
for (const [path, title, home, href] of [
  ['/id/halaman-yang-tidak-ada', 'Boo! Halamannya hilang.', 'Beranda', '/id'],
  ['/en/missing-page', 'Boo! Page missing.', 'Home', '/en'],
] as const) {
  test(`URL tidak dikenal ${path} menampilkan 404 sesuai bahasa`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(404)
    const main = page.locator('main')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(main.getByRole('link', { name: home, exact: true })).toHaveAttribute('href', href)
    await expect(main.getByText(/Apa itu 404|What does 404 mean/)).toHaveCount(0)
    await expect(
      main.getByText(path.startsWith('/id') ? 'Boo! Page missing.' : 'Boo! Halamannya hilang.'),
    ).toHaveCount(0)
  })
}
