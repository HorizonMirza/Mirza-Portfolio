import { expect, test } from '@playwright/test'

import { ADMIN_STATE, hasAdminEnv, uniqueIp } from './helpers'

test.skip(!hasAdminEnv, 'butuh ADMIN_EMAIL dan ADMIN_PASSWORD')
test.use({ storageState: ADMIN_STATE, contextOptions: { reducedMotion: 'reduce' } })

// Tes yang membuat atau mengeluarkan sesi admin hanya di satu proyek: proyek lain berjalan bersamaan
// dan bisa saja mengeluarkan sesi milik tes ini.
const SESSION_PROJECT = 'chromium'

test.describe('Admin → Akun', () => {
  // Desain 1 "Profil ala WhatsApp" (DESIGN.md bagian 124): semua kelompok langsung terlihat; foto, nama,
  // password, dan riwayat lengkap dibuka sebagai halaman kedua dengan tombol kembali.
  test('identitas, email disamarkan, perangkat langsung terlihat', async ({ page }) => {
    await page.goto('/admin/account')
    const email = process.env.ADMIN_EMAIL!
    const main = page.locator('main')
    await expect(main).not.toContainText(email)
    await main.getByRole('button', { name: 'Tampilkan' }).click()
    await expect(main).toContainText(email)
    await expect(main.getByText('Super Admin', { exact: true })).toBeVisible()
    for (const group of ['Info', 'Keamanan', 'Aktivitas terbaru'])
      await expect(main.getByRole('heading', { name: group, exact: true })).toBeVisible()
    await expect(main.getByRole('heading', { name: /^Perangkat tertaut · \d+$/ })).toBeVisible()
    await expect(main.getByText('Perangkat ini', { exact: true })).toBeVisible()
  })

  test('ganti password di halaman kedua: aturan dan meter kekuatan, lalu kembali', async ({
    page,
  }) => {
    await page.goto('/admin/account')
    const opener = page.locator('main').getByRole('button', { name: /^Ganti password/ })
    await opener.click()
    await expect(page.getByRole('heading', { name: 'Ganti password' })).toBeFocused()
    await page.getByLabel('Password saat ini').fill('password-lama-sekali')
    const next = page.getByLabel('Password baru', { exact: true })
    await next.fill('pendek')
    await expect(page.getByText('Kekuatan: Terlalu pendek')).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Minimal 12 karakter' }),
    ).toContainText('(belum terpenuhi)')
    await next.fill('kopi pagi di teras rumah')
    await expect(page.getByText('Kekuatan: Sangat kuat')).toBeVisible()
    await page.getByLabel('Ulangi password baru').fill('kopi pagi di teras rumah')
    await expect(page.getByRole('listitem').filter({ hasText: 'Ulangan sama' })).toContainText(
      '(terpenuhi)',
    )
    // tidak dikirim: mengganti password akan mengeluarkan sesi tes lain
    await page.getByRole('button', { name: 'Kembali ke Akun' }).click()
    await expect(opener).toBeFocused()
  })

  test('foto profil dibuka dari tombol kamera', async ({ page }) => {
    await page.goto('/admin/account')
    await page.getByRole('button', { name: 'Ganti foto profil' }).click()
    await expect(page.getByRole('heading', { name: 'Foto profil' })).toBeFocused()
    await page.getByRole('button', { name: 'Kembali ke Akun' }).click()
    await expect(page.getByRole('button', { name: 'Ganti foto profil' })).toBeFocused()
  })

  test('nama akun bisa diubah lalu dikembalikan', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== SESSION_PROJECT, 'mengubah data akun bersama')
    await page.goto('/admin/account')
    const main = page.locator('main')
    const rename = async (value: string) => {
      await main.getByRole('button', { name: /^Nama / }).click()
      const field = page.getByLabel('Nama', { exact: true })
      await field.fill(value)
      await page.getByRole('button', { name: 'Simpan' }).click()
      await expect(page.getByText('Nama disimpan.')).toBeVisible()
      await expect(main.getByText(value, { exact: true }).first()).toBeVisible()
    }
    const original = (await main.getByRole('button', { name: /^Nama / }).innerText())
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)[1]!
    await rename(`${original} E2E`)
    await rename(original)
  })

  test('login gagal tercatat dan bisa disaring di semua aktivitas', async ({
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
    const main = page.locator('main')
    // dicatat lewat after(), sesaat setelah respons login terkirim
    await expect(async () => {
      await page.reload()
      await main.getByRole('button', { name: /^Lihat semua aktivitas/ }).click({ timeout: 1000 })
      await page.getByRole('button', { name: /^Gagal \(\d+\)$/ }).click({ timeout: 1000 })
      await expect(main.locator('[data-event="failed"]').first()).toBeVisible({ timeout: 1000 })
    }).toPass()
    await expect(main.locator('[data-event="success"]')).toHaveCount(0)
    await expect(main.locator('[data-event="failed"]').first()).toContainText('Gagal masuk')
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
    const row = page
      .locator('main [data-session]')
      .filter({ hasText: 'Browser tidak dikenal di Windows' })
      .first()
    await row.getByRole('button', { name: /^Keluarkan/ }).click()
    await expect(page.getByText('Perangkat dikeluarkan.')).toBeVisible()
    await expect.poll(sessionOf).toBeNull()
    await other.dispose()
  })

  test('keluar dari semua perangkat lain minta konfirmasi dulu', async ({ page }) => {
    await page.goto('/admin/account')
    const all = page.getByRole('button', { name: 'Keluar dari semua perangkat lain' })
    // setup login E2E dan tes lain hampir selalu menyisakan sesi lain; bila tidak ada, baris tidak tampil
    test.skip((await all.count()) === 0, 'tidak ada perangkat lain')
    await all.click()
    const ask = page.getByRole('alertdialog', { name: 'Keluar dari semua perangkat lain?' })
    await expect(ask.getByRole('button', { name: 'Keluarkan' })).toBeFocused()
    // tidak dikonfirmasi: akan mengeluarkan sesi tes lain
    await ask.getByRole('button', { name: 'Batal' }).click()
    await expect(ask).toHaveCount(0)
  })
})

test.describe('Admin → Pengaturan', () => {
  test('saklar disimpan otomatis dan bertahan setelah dimuat ulang', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== SESSION_PROJECT, 'mengubah pengaturan bersama')
    // "Email saat ada pesan baru" tidak mengubah tampilan situs, jadi aman diubah saat tes lain jalan
    const toggle = () => page.getByRole('switch', { name: 'Email saat ada pesan baru' })
    await page.goto('/admin/settings')
    // klik lalu tunggu jawaban Server Action: memuat ulang sebelum simpan selesai membatalkannya
    const flip = async () => {
      const saved = page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().includes('/admin/settings'),
      )
      await toggle().click()
      await saved
    }
    const before = await toggle().getAttribute('aria-checked')
    const flipped = before === 'true' ? 'false' : 'true'
    await flip()
    await expect(toggle()).toHaveAttribute('aria-checked', flipped)
    await expect(page.getByText('Tersimpan', { exact: true })).toBeVisible()
    await page.reload()
    await expect(toggle()).toHaveAttribute('aria-checked', flipped)
    // kembalikan
    await flip()
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
    // Isian bisa masuk sebelum React selesai hidrasi (WebKit di CI): diulang sampai tanda galat
    // muncul. Hanya nilai tidak sah yang diisi, jadi tidak ada yang tersimpan.
    await expect(async () => {
      await limit.fill('')
      await limit.fill('0')
      await expect(limit).toHaveAttribute('aria-invalid', 'true', { timeout: 1000 })
    }).toPass()
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
    await expect(page.locator('main').getByText('Tidak ada catatan yang cocok.')).toBeVisible()
    await page.getByRole('link', { name: 'Hapus saringan' }).click()
    await expect(page).toHaveURL(/\/admin\/audit$/)
  })
})
