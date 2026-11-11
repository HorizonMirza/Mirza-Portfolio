import { expect, test } from '@playwright/test'

import { ADMIN_STATE, hasAdminEnv, uniqueIp } from './helpers'

test.skip(!hasAdminEnv, 'butuh ADMIN_EMAIL dan ADMIN_PASSWORD')
test.use({ storageState: ADMIN_STATE, contextOptions: { reducedMotion: 'reduce' } })

// Tes yang membuat atau mengeluarkan sesi admin hanya di satu proyek: proyek lain berjalan bersamaan
// dan bisa saja mengeluarkan sesi milik tes ini.
const SESSION_PROJECT = 'chromium'

test.describe('Admin → Akun', () => {
  test('identitas, email disamarkan, dan perangkat ini', async ({ page }) => {
    await page.goto('/admin/account')
    const email = process.env.ADMIN_EMAIL!
    const main = page.locator('main')
    await expect(main).not.toContainText(email)
    await main.getByRole('button', { name: 'Tampilkan' }).click()
    await expect(main).toContainText(email)
    await expect(main.getByText('Super Admin')).toBeVisible()

    const devices = main.getByRole('button', { name: /^Perangkat/ })
    await expect(devices).toHaveAttribute('aria-expanded', 'false')
    await devices.click()
    await expect(devices).toHaveAttribute('aria-expanded', 'true')
    await expect(main.getByText('Perangkat ini')).toBeVisible()
  })

  test('ganti password: aturan dicentang dan meter kekuatan saat mengetik', async ({ page }) => {
    await page.goto('/admin/account')
    await page.locator('main').getByRole('button', { name: 'Ganti password' }).click()
    await page.getByLabel('Password saat ini').fill('password-lama-sekali')
    const next = page.getByLabel('Password baru', { exact: true })
    await next.fill('pendek')
    await expect(page.getByText('Kekuatan: Terlalu pendek')).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Minimal 12 karakter' }),
    ).toContainText('(belum terpenuhi)')
    await next.fill('kopi pagi di teras rumah')
    await expect(page.getByText('Kekuatan: Sangat kuat')).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Minimal 12 karakter' }),
    ).toContainText('(terpenuhi)')
    await page.getByLabel('Ulangi password baru').fill('kopi pagi di teras rumah')
    await expect(page.getByRole('listitem').filter({ hasText: 'Ulangan sama' })).toContainText(
      '(terpenuhi)',
    )
    // tidak dikirim: mengganti password akan mengeluarkan sesi tes lain
  })

  test('login gagal tercatat di aktivitas dan bisa disaring', async ({
    page,
    request,
    baseURL,
  }) => {
    const res = await request.post('/api/auth/sign-in/email', {
      headers: { origin: baseURL!, 'x-forwarded-for': uniqueIp() },
      data: { email: process.env.ADMIN_EMAIL, password: 'password-salah-untuk-tes' },
    })
    expect(res.status()).toBe(401)
    await page.goto('/admin/account')
    const activity = page.locator('main').getByRole('list', { name: 'Aktivitas' })
    // dicatat lewat after(), sesaat setelah respons login terkirim
    await expect(async () => {
      await page.reload()
      await expect(activity.locator('[data-event="failed"]').first()).toBeVisible({
        timeout: 1000,
      })
    }).toPass()
    await page.getByRole('button', { name: /^Gagal \(\d+\)$/ }).click()
    await expect(activity.locator('[data-event="success"]')).toHaveCount(0)
    await expect(activity.locator('[data-event="failed"]').first()).toContainText('Gagal masuk')
  })

  test('perangkat lain bisa dikeluarkan dan sesinya langsung berakhir', async ({
    page,
    playwright,
    baseURL,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SESSION_PROJECT, 'membuat dan mengeluarkan sesi admin')
    // sesi kedua dari "perangkat" yang dikenali sebagai browser tidak dikenal di Windows
    const other = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        origin: baseURL!,
        'x-forwarded-for': uniqueIp(),
        'user-agent': 'E2E-Perangkat-Lain/1.0 (Windows NT 10.0; Win64; x64)',
      },
    })
    const signIn = await other.post('/api/auth/sign-in/email', {
      data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    })
    expect(signIn.ok()).toBe(true)
    const sessionOf = async () =>
      (await (await other.get('/api/auth/get-session')).json()) as unknown
    expect(await sessionOf()).not.toBeNull()

    await page.goto('/admin/account')
    const main = page.locator('main')
    await main.getByRole('button', { name: /^Perangkat/ }).click()
    const row = main
      .locator('[data-session]')
      .filter({ hasText: 'Browser tidak dikenal di Windows' })
      .first()
    await row.getByRole('button', { name: 'Keluarkan' }).click()
    await expect(page.getByText('Perangkat dikeluarkan.')).toBeVisible()
    await expect.poll(sessionOf).toBeNull()
    await other.dispose()
  })
})

test.describe('Admin → Pengaturan', () => {
  test('saklar disimpan otomatis dan bertahan setelah dimuat ulang', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== SESSION_PROJECT, 'mengubah pengaturan bersama')
    // "Email saat ada pesan baru" tidak mengubah tampilan situs, jadi aman diubah saat tes lain jalan
    const toggle = () => page.getByRole('switch', { name: 'Email saat ada pesan baru' })
    await page.goto('/admin/settings')
    const before = await toggle().getAttribute('aria-checked')
    const flipped = before === 'true' ? 'false' : 'true'
    await toggle().click()
    await expect(toggle()).toHaveAttribute('aria-checked', flipped)
    await expect(page.getByText('Tersimpan', { exact: true })).toBeVisible()
    await page.reload()
    await expect(toggle()).toHaveAttribute('aria-checked', flipped)
    // kembalikan
    await toggle().click()
    await expect(toggle()).toHaveAttribute('aria-checked', before!)
    await page.reload()
    await expect(toggle()).toHaveAttribute('aria-checked', before!)

    // kedua perubahan tercatat di log audit sebagai kalimat, dengan nama kolom yang dikenal
    await page.goto('/admin/audit?entity=SiteSetting&action=update&q=emailOnMessage')
    const row = page.locator('main li[data-audit="update"]').first()
    await expect(row).toContainText('mengubah pengaturan situs')
    await row.locator('summary').click()
    await expect(row.getByRole('table')).toContainText('Email saat ada pesan baru')
    await expect(row.getByRole('link', { name: 'Buka' })).toHaveAttribute('href', '/admin/settings')
  })

  test('mode perawatan minta konfirmasi dulu', async ({ page }) => {
    await page.goto('/admin/settings')
    const maintenance = page.getByRole('switch', { name: 'Mode perawatan' })
    await expect(maintenance).toHaveAttribute('aria-checked', 'false')
    await maintenance.click()
    const ask = page.getByRole('alertdialog', { name: 'Nyalakan mode perawatan?' })
    await expect(ask).toBeVisible()
    await expect(ask.getByRole('button', { name: 'Nyalakan' })).toBeFocused()
    // tidak dinyalakan: seluruh situs publik akan tertutup untuk tes lain
    await ask.getByRole('button', { name: 'Batal' }).click()
    await expect(ask).toHaveCount(0)
    await expect(maintenance).toHaveAttribute('aria-checked', 'false')
  })

  test('batas pesan per jam di luar 1–50 ditandai tanpa disimpan', async ({ page }) => {
    await page.goto('/admin/settings')
    const limit = page.getByRole('spinbutton', { name: 'Batas pesan per jam' })
    await limit.fill('0')
    await expect(limit).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Isi angka 1 sampai 50')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('spinbutton', { name: 'Batas pesan per jam' })).not.toHaveValue('0')
  })
})

test.describe('Log audit', () => {
  test('saring aksi dan cari tanpa hasil', async ({ page }) => {
    await page.goto('/admin/audit?action=delete')
    await expect(page.getByRole('link', { name: 'hapus', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    for (const action of await page
      .locator('main li[data-audit]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-audit'))))
      expect(action).toBe('delete')

    await page.getByRole('searchbox', { name: 'Cari target atau kolom' }).fill('tidak-ada-zzzz-123')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page).toHaveURL(/q=tidak-ada-zzzz-123/)
    // saringan aksi tetap dipakai bersama pencarian
    await expect(page).toHaveURL(/action=delete/)
    await expect(page.getByText('Tidak ada catatan yang cocok.')).toBeVisible()
    await page.getByRole('link', { name: 'Hapus saringan' }).click()
    await expect(page).toHaveURL(/\/admin\/audit$/)
  })
})
