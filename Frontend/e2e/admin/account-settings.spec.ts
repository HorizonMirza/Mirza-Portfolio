import { expect, test } from '@playwright/test'

import { ADMIN_STATE, hasAdminEnv, uniqueIp } from './helpers'

test.skip(!hasAdminEnv, 'butuh ADMIN_EMAIL dan ADMIN_PASSWORD')
test.use({ storageState: ADMIN_STATE, contextOptions: { reducedMotion: 'reduce' } })

// Tes yang membuat atau mengeluarkan sesi admin hanya di satu proyek: proyek lain berjalan bersamaan
// dan bisa saja mengeluarkan sesi milik tes ini.
const SESSION_PROJECT = 'chromium'

test.describe('Admin → Akun', () => {
  // Desain 1 "Profil ala WhatsApp" (DESIGN.md bagian 124): semua kelompok langsung terlihat. Revisi
  // 2026-11-16: foto penuh, kamera ke pemilih berkas, email tampil, ganti nama/email/password lewat dialog.
  test('identitas, email tampil apa adanya, perangkat langsung terlihat', async ({ page }) => {
    await page.goto('/admin/account')
    const email = process.env.ADMIN_EMAIL!
    const main = page.locator('main')
    // email tidak disamarkan dan tanpa tombol Tampilkan
    await expect(main).toContainText(email)
    await expect(main.getByRole('button', { name: 'Tampilkan' })).toHaveCount(0)
    await expect(main.getByText('Super Admin', { exact: true })).toBeVisible()
    for (const group of ['Info', 'Keamanan'])
      await expect(main.getByRole('heading', { name: group, exact: true })).toBeVisible()
    await expect(main.getByRole('heading', { name: /^Perangkat Tertaut · \d+$/ })).toBeVisible()
    await expect(main.getByText('Perangkat Ini', { exact: true })).toBeVisible()
    // daftar aktivitas terbaru dihapus dari halaman Akun (revisi 2026-11-16)
    await expect(main.getByRole('heading', { name: 'Aktivitas terbaru' })).toHaveCount(0)
    await expect(main.getByRole('button', { name: /^Lihat semua aktivitas/ })).toHaveCount(0)
  })

  test('ganti password di dialog: aturan dan meter kekuatan, lalu tutup', async ({ page }) => {
    await page.goto('/admin/account')
    const opener = page.locator('main').getByRole('button', { name: /^Ganti Password/ })
    await opener.click()
    const dialog = page.getByRole('dialog', { name: 'Ganti Password' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Password Saat Ini').fill('password-lama-sekali')
    const next = dialog.getByLabel('Password Baru', { exact: true })
    await next.fill('pendek')
    await expect(dialog.getByText('Kekuatan: Terlalu pendek')).toBeVisible()
    await expect(
      dialog.getByRole('listitem').filter({ hasText: 'Minimal 8 karakter' }),
    ).toContainText('(belum terpenuhi)')
    for (const rule of ['Minimal 1 Huruf Besar', 'Minimal 1 Angka', 'Minimal 1 Karakter Spesial'])
      await expect(dialog.getByRole('listitem').filter({ hasText: rule })).toContainText(
        '(belum terpenuhi)',
      )
    await next.fill('Kopi-Pagi-8-Teras-Rumah!')
    await expect(dialog.getByText('Kekuatan: Sangat Kuat')).toBeVisible()
    for (const rule of [
      'Minimal 1 Huruf Besar',
      'Minimal 1 Huruf Kecil',
      'Minimal 1 Angka',
      'Minimal 1 Karakter Spesial',
    ])
      await expect(dialog.getByRole('listitem').filter({ hasText: rule })).toContainText(
        '(terpenuhi)',
      )
    // tanpa kolom ulangi; hanya lima syarat yang tampil, dan kolom password memberi contoh panjang minimal
    await expect(dialog.getByLabel('Ulangi password baru')).toHaveCount(0)
    await expect(dialog.getByRole('listitem')).toHaveCount(5)
    await expect(next).toHaveAttribute('placeholder', 'Min. 8 Karakter')
    // tombol mata menampilkan dan menyembunyikan isian; tombol Simpan satu baris penuh
    await expect(next).toHaveAttribute('type', 'password')
    await dialog.getByRole('button', { name: 'Tampilkan Password' }).nth(1).click()
    await expect(next).toHaveAttribute('type', 'text')
    await dialog.getByRole('button', { name: 'Sembunyikan Password' }).click()
    await expect(next).toHaveAttribute('type', 'password')
    await expect(dialog.getByText('Frasa panjang')).toHaveCount(0)
    const save = dialog.getByRole('button', { name: 'Simpan', exact: true })
    const box = await dialog.boundingBox()
    const saveBox = await save.boundingBox()
    expect(saveBox!.width).toBeGreaterThan(box!.width - 80)
    // judul syarat dan garis kekuatan tunggal tampil
    await expect(dialog.getByText('Syarat Password:')).toBeVisible()
    // tidak dikirim: mengganti password akan mengeluarkan sesi tes lain
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(opener).toBeFocused()
  })

  test('foto tidak bisa ditekan; kamera langsung ke pemilih berkas', async ({ page }) => {
    await page.goto('/admin/account')
    // foto hanya gambar (tanpa tampilan penuh); satu-satunya tombol foto adalah kamera
    await expect(page.getByRole('button', { name: 'Lihat foto profil' })).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // tanpa halaman kedua: Cloudinary tidak diatur di tes, jadi pemilih berkas menjawab "belum aktif"
    await page.getByRole('button', { name: 'Ganti Foto Profil' }).click()
    await expect(page.getByText(/Unggah belum aktif/).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Foto Profil' })).toHaveCount(0)
  })

  test('ganti email: email lama tampil, kolom baru dan password diminta', async ({ page }) => {
    await page.goto('/admin/account')
    await page
      .locator('main')
      .getByRole('button', { name: /^Email/ })
      .click()
    const dialog = page.getByRole('dialog', { name: 'Ganti Email' })
    await expect(dialog).toBeVisible()
    // email sekarang: kotak besar bertuliskan "Email Lama" yang hanya ditampilkan (bukan isian)
    await expect(dialog.getByText('Email Lama', { exact: true })).toBeVisible()
    await expect(dialog.getByText(process.env.ADMIN_EMAIL!, { exact: true })).toBeVisible()
    await expect(dialog.getByLabel('Email Lama')).toHaveCount(0)
    const save = dialog.getByRole('button', { name: 'Simpan' })
    await expect(save).toBeDisabled()
    await dialog.getByLabel('Email Baru').fill('baru@contoh.com')
    await expect(save).toBeDisabled()
    await dialog.getByLabel('Password', { exact: true }).fill('apa-saja')
    await expect(save).toBeEnabled()
    // tidak dikirim: mengganti email akan mengubah akun yang dipakai tes lain
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test('nama akun bisa diubah dengan password lalu dikembalikan', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== SESSION_PROJECT, 'mengubah data akun bersama')
    await page.goto('/admin/account')
    const main = page.locator('main')
    const nameRow = main.getByRole('button', { name: /^Nama / })
    const rename = async (value: string) => {
      await nameRow.click()
      const dialog = page.getByRole('dialog', { name: 'Ganti Nama' })
      await dialog.getByLabel('Nama Baru').fill(value)
      await dialog.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD!)
      await dialog.getByRole('button', { name: 'Simpan' }).click()
      await expect(page.getByText('Nama disimpan.')).toBeVisible()
      await expect(dialog).toHaveCount(0)
      await expect(main.getByText(value, { exact: true }).first()).toBeVisible()
    }
    const original = (await nameRow.innerText())
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)[1]!
    // password salah ditolak di kolomnya dan nama tidak berubah
    await nameRow.click()
    const wrong = page.getByRole('dialog', { name: 'Ganti Nama' })
    await expect(wrong.getByText('Nama Lama', { exact: true })).toBeVisible()
    await expect(wrong.getByText(original, { exact: true })).toBeVisible()
    await expect(wrong.getByLabel('Nama Lama')).toHaveCount(0)
    await wrong.getByLabel('Nama Baru').fill(`${original} SALAH`)
    await wrong.getByLabel('Password', { exact: true }).fill('password-salah-untuk-tes')
    await wrong.getByRole('button', { name: 'Simpan' }).click()
    await expect(wrong.getByText('Password salah', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(main.getByText(`${original} SALAH`)).toHaveCount(0)
    await rename(`${original} E2E`)
    await rename(original)
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
    const all = page.getByRole('button', { name: 'Keluar dari Semua Perangkat Lain' })
    // setup login E2E dan tes lain hampir selalu menyisakan sesi lain; bila tidak ada, baris tidak tampil
    test.skip((await all.count()) === 0, 'tidak ada perangkat lain')
    await all.click()
    const ask = page.getByRole('alertdialog', { name: 'Keluar dari Semua Perangkat Lain?' })
    await expect(ask.getByRole('button', { name: 'Keluarkan' })).toBeFocused()
    // tidak dikonfirmasi: akan mengeluarkan sesi tes lain
    await ask.getByRole('button', { name: 'Batal' }).click()
    await expect(ask).toHaveCount(0)
  })
})

test.describe('Admin → Pengaturan', () => {
  test('saklar disimpan otomatis dan bertahan setelah dimuat ulang', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== SESSION_PROJECT, 'mengubah pengaturan bersama')
    // "Hitung Kunjungan" tidak mengubah tampilan situs, jadi aman diubah saat tes lain jalan
    const toggle = () => page.getByRole('switch', { name: 'Hitung Kunjungan' })
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
  })

  test('kelompok Suara berisi semua suara dan pilihan memakai daftar bergaya aplikasi', async ({
    page,
  }) => {
    await page.goto('/admin/settings')
    // satu geseran per suara situs, tanpa volume utama (revisi 2026-11-16)
    await expect(page.getByRole('heading', { name: 'Suara', exact: true })).toBeVisible()
    await expect(page.getByRole('slider')).toHaveCount(9)
    for (const name of ['Menu', 'Tombol Tema', 'Kartu ID Kontak'])
      await expect(page.getByRole('slider', { name, exact: true })).toBeVisible()
    await expect(page.getByRole('slider', { name: 'Semua suara' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Konten', exact: true })).toHaveCount(0)
    // urutan kelompok Tampilan (revisi 2026-11-16)
    const titles = [
      'Tema Awal Pengunjung',
      'Bahasa Saat Pertama Dibuka',
      'Kartu Pembuka Muncul',
      'Kartu Pembuka',
      'Animasi Hero',
      'Tombol WhatsApp Melayang',
    ]
    const group = page.getByRole('region', { name: 'Tampilan', exact: true })
    // judul tiap baris (lencana seperti "Nomor belum diisi" ikut satu paragraf, jadi ambil baris pertama)
    const shown = (await group.locator('p[id$="-t"]').allInnerTexts()).map((text) =>
      text.split('\n')[0]!.trim(),
    )
    expect(shown).toEqual(titles)
    // tanpa dropdown bawaan browser: combobox membuka daftar pilihan, Escape menutup tanpa mengubah
    await expect(page.locator('main select')).toHaveCount(0)
    const theme = page.getByRole('combobox', { name: 'Tema Awal Pengunjung' })
    const before = await theme.innerText()
    await expect(async () => {
      await theme.click({ timeout: 2000 })
      await expect(page.getByRole('listbox')).toBeVisible({ timeout: 1000 })
    }).toPass()
    await expect(page.getByRole('option')).toHaveCount(3)
    await expect(page.getByRole('option', { selected: true })).toHaveText(before)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(theme).toHaveText(before)
  })

  test('mode perawatan minta konfirmasi dulu', async ({ page }) => {
    await page.goto('/admin/settings')
    const maintenance = page.getByRole('switch', { name: 'Mode Perawatan' })
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

  test('angka yang dikembalikan ke nilai semula sebelum tersimpan tidak ikut tersimpan', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SESSION_PROJECT, 'mengubah pengaturan bersama')
    await page.goto('/admin/settings')
    const limit = page.getByRole('textbox', { name: 'Batas Pesan per Jam' })
    const original = await limit.inputValue()
    const other = original === '7' ? '8' : '7'
    await limit.click()
    await limit.press('Control+A')
    await limit.pressSequentially(other)
    await limit.press('Control+A')
    await limit.pressSequentially(original)
    // ketiadaan simpan tidak bisa ditunggu lewat kejadian: tunggu lebih lama dari jeda simpan (600 ms)
    await page.waitForTimeout(1500)
    await expect(limit).toHaveValue(original)
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Batas Pesan per Jam' })).toHaveValue(original)
  })
  test('batas pesan per jam di luar 1–50 ditandai tanpa disimpan', async ({ page }) => {
    await page.goto('/admin/settings')
    const limit = page.getByRole('textbox', { name: 'Batas Pesan per Jam' })
    // Isian bisa masuk sebelum React selesai hidrasi (WebKit di CI): diulang sampai tanda galat
    // muncul. Hanya nilai tidak sah yang diisi, jadi tidak ada yang tersimpan.
    await expect(async () => {
      await limit.fill('')
      await limit.fill('0')
      await expect(limit).toHaveAttribute('aria-invalid', 'true', { timeout: 1000 })
    }).toPass()
    await expect(page.getByText('Isi angka 1 sampai 50')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Batas Pesan per Jam' })).not.toHaveValue('0')
  })
})
