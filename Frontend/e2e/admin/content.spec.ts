import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ISR_REFRESH_TIMEOUT } from '../wait'
import { ADMIN_STATE, hasAdminEnv } from './helpers'

test.skip(!hasAdminEnv, 'butuh ADMIN_EMAIL dan ADMIN_PASSWORD')
test.use({ storageState: ADMIN_STATE, contextOptions: { reducedMotion: 'reduce' } })

const PAGES = [
  '/admin',
  '/admin/profile',
  '/admin/projects',
  '/admin/projects/new',
  '/admin/skills',
  '/admin/experience',
  '/admin/experience/new',
  '/admin/education',
  '/admin/education/new',
  '/admin/messages',
  '/admin/audit',
  '/admin/pages/intro',
  '/admin/pages/home',
  '/admin/pages/about',
  '/admin/pages/experience',
  '/admin/pages/projects',
  '/admin/pages/contact',
  '/admin/pages/navbar',
  '/admin/pages/footer',
  '/admin/pages/privacy',
  '/admin/pages/other',
  '/admin/settings',
  '/admin/account',
]

for (const theme of ['light', 'dark'] as const) {
  test(`halaman admin (${theme}) tanpa pelanggaran aksesibilitas dan CSP`, async ({ page }) => {
    // 22 halaman diperiksa axe dalam satu tes; batas 30 detik terlalu ketat bila data uji menumpuk
    test.setTimeout(150_000)
    await page.addInitScript((value) => localStorage.setItem('mmirza-theme', value), theme)
    const failures: string[] = []
    // CSP admin ber-nonce: skrip Next.js dan skrip tema harus tetap jalan
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy|CSP/i.test(m.text()))
        failures.push(`CSP: ${m.text()}`)
    })
    for (const path of PAGES) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.locator('html')).toHaveClass(new RegExp(theme))
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      failures.push(...results.violations.map((v) => `${path} ${v.id}: ${v.help}`))
    }
    expect(failures).toEqual([])
  })
}

test('halaman admin yang tidak ada mengembalikan 404', async ({ page }) => {
  const response = await page.goto('/admin/belum-ada')
  expect(response?.status()).toBe(404)
})

test('CRUD project: buat, tampil di daftar, ubah, hapus, dan tercatat di audit', async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`
  const titleId = `Project E2E ${suffix}`
  await page.goto('/admin/projects/new')

  // Validasi: galat bahasa yang tampil langsung terlihat, galat bahasa lain diberitahukan (judul dan
  // ringkasan; deskripsi opsional sejak audit 2026-10-31 GAP-05). Pengalih bahasa isian hanya di top bar.
  await page.getByRole('button', { name: 'Buat project' }).click()
  await expect(page.getByText('Judul wajib diisi')).toBeVisible()
  await expect(page.getByText('2 galat di isian English.')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Indonesia|English/ })).toHaveCount(0)

  await page.getByLabel('Judul', { exact: true }).fill(titleId)
  await page.getByLabel('Ringkasan', { exact: true }).fill('Ringkasan untuk tes E2E.')
  await page.getByLabel('Peran saya (opsional)').fill('Peran E2E')
  await page.locator('#description_id').fill('Deskripsi **E2E**.')
  // "Buka isian English" mengganti seluruh tampilan admin ke bahasa Inggris (DESIGN.md bagian 115):
  // label, tombol, notifikasi, dan daftar sesudah ini berbahasa Inggris
  await page.getByRole('button', { name: 'Buka isian English' }).click()
  await page.getByLabel('Title', { exact: true }).fill(`E2E project ${suffix}`)
  await page.getByLabel('Summary', { exact: true }).fill('Summary for the E2E test.')
  await page.locator('#description_en').fill('Description.')
  await page.getByLabel('Slug').fill(`e2e-${suffix}`.toLowerCase())
  // tombol detail: demo tampil, GitHub dimatikan Super Admin walau URL-nya diisi
  await page.getByLabel('Demo URL (optional)').fill('https://example.com/demo')
  await page.getByLabel('Repo URL (optional)').fill('https://github.com/example/repo')
  await page.getByLabel('Show the "GitHub" button (repo URL)').uncheck()
  // satu skill agar chip teknologi project ikut diuji
  await page
    .locator('fieldset')
    .filter({ hasText: 'Programming Languages' })
    .getByText('TypeScript', { exact: true })
    .click()
  await page.getByRole('button', { name: 'Create project' }).click()
  await expect(page.getByText('Project created.')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/)
  const projectId = page.url().split('/').pop()!

  // Ubah status menjadi terbit
  await page.getByLabel('Status').selectOption('PUBLISHED')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Project saved.')).toBeVisible()

  // Project yang terbit setelah build langsung tampil di situs publik (revalidasi + dynamicParams).
  const slug = `e2e-${suffix}`.toLowerCase()
  const detail = await page.goto(`/id/projects/${slug}`)
  expect(detail?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titleId)
  await expect(page.getByText('Peran E2E')).toBeVisible()
  const main = page.getByRole('main')
  await expect(main.getByRole('link', { name: /Lihat aplikasi/ })).toHaveAttribute(
    'href',
    'https://example.com/demo',
  )
  await expect(main.getByRole('link', { name: /GitHub/ })).toHaveCount(0)
  await page.goto('/en/projects')
  await expect(page.getByRole('link', { name: `E2E project ${suffix}` })).toBeVisible()

  // Aksesibilitas halaman publik saat ada project terbit (kartu, chip teknologi, detail).
  const publicFailures: string[] = []
  for (const path of ['/en/projects', '/id', `/id/projects/${slug}`]) {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    publicFailures.push(...results.violations.map((v) => `${path} ${v.id}: ${v.help}`))
  }
  expect(publicFailures).toEqual([])

  // daftar admin masih berbahasa Inggris: judul project tampil versi Inggrisnya
  const titleEn = `E2E project ${suffix}`
  await page.goto('/admin/projects')
  await page.getByRole('searchbox', { name: 'Search projects' }).fill(suffix)
  const item = page.getByText(titleEn).locator('visible=true').first()
  await expect(item).toBeVisible()

  // Hapus dengan konfirmasi
  await page
    .getByRole('button', { name: `Delete ${titleEn}` })
    .locator('visible=true')
    .first()
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Project deleted.')).toBeVisible()
  await expect(page.getByText(titleEn)).toHaveCount(0)

  // Status dicek langsung ke server, tanpa cache HTTP browser. Firefox menerapkan
  // stale-while-revalidate juga untuk navigasi, jadi `next start` lokal bisa menyajikan salinan
  // lama dari cache browser. Di Vercel, CDN mengganti Cache-Control ke browser.
  const gone = await page.request.get(`/id/projects/${slug}`)
  expect(gone.status()).toBe(404)

  await page.goto('/admin/audit?entity=Project')
  // dicari lewat ID project ini: tes browser lain bisa menulis log audit pada saat yang sama
  await expect(
    page
      .locator('main ol > li')
      .filter({ hasText: projectId.slice(0, 8) })
      .first(),
  ).toContainText('delete')

  // Regresi: revalidasi setelah simpan tidak boleh membuat halaman publik menjadi 404. Dicek langsung
  // ke server (seperti status 404 di atas): navigasi Firefox bisa dijawab cache browser dengan 304
  // atau tanpa respons sama sekali (CI 2026-10-20).
  for (const locale of ['id', 'en']) {
    const response = await page.request.get(`/${locale}`)
    expect(response.status(), `/${locale}`).toBe(200)
  }
})

test('kategori skill yang masih berisi tidak bisa dihapus', async ({ page }) => {
  await page.goto('/admin/skills')
  const first = page.getByRole('button', { name: /^Hapus kategori / }).first()
  await first.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText(/Kategori masih berisi \d+ skill/)).toBeVisible()
})

// Dua tes di bawah mengubah data global bersama (pengaturan situs dan teks Home), lalu
// mengembalikannya. Bila dijalankan di semua proyek browser sekaligus, satu proyek bisa
// mengembalikan nilai saat proyek lain masih memeriksanya (audit 2026-10-31, BUG-07). Karena itu
// keduanya hanya berjalan di proyek chromium; alur admin ini tidak bergantung pada mesin browser.
const GLOBAL_MUTATION_PROJECT = 'chromium'
const globalMutationReason = 'mengubah data global bersama; satu proyek saja agar tidak balapan'

test('volume suara dari pengaturan dipakai situs publik', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== GLOBAL_MUTATION_PROJECT, globalMutationReason)
  await page.goto('/admin/settings')
  const slider = page.getByLabel('Volume')
  const output = page.locator('output[for="soundVolume"]')
  // Isian bisa masuk sebelum React selesai hidrasi, sehingga label tidak ikut berubah. Tiap
  // percobaan mengisi nilai lain dulu: mengisi nilai yang sudah ada tidak memicu event input.
  await expect(async () => {
    await slider.fill('30')
    await slider.fill('35')
    await expect(output).toHaveText('35%', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pengaturan disimpan.')).toBeVisible()
  // dicek langsung ke server agar cache browser WebKit/Firefox tidak menyajikan halaman lama
  await expect
    .poll(async () => (await page.request.get('/id')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .toContain('data-sound-volume="35"')
  // kembalikan ke bawaan agar tes lain tidak terpengaruh
  await page.goto('/admin/settings')
  await expect(async () => {
    await slider.fill('75')
    await slider.fill('80')
    await expect(output).toHaveText('80%', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pengaturan disimpan.')).toBeVisible()
})

test('modul Home: peran di bawah foto diubah, tampil di situs, lalu dikembalikan', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== GLOBAL_MUTATION_PROJECT, globalMutationReason)
  // sejak 2026-11-10 Home hanya mengelola foto profil, foto utama, dan peran (permintaan pemilik).
  // Yang diubah peran bahasa Inggris dan dicek di /en: tes halaman Tentang (/id/about) berjalan
  // bersamaan dan memeriksa peran bahasa Indonesia, jadi keduanya tidak saling mengganggu.
  const field = () => page.getByLabel('Roles', { exact: true })
  // bahasa admin EN disetel lewat cookie sebelum halaman dibuka (sama seperti pilihan tombol bahasa
  // di top bar), agar tidak berpacu dengan hidrasi tombol. Tampilan admin ikut berbahasa Inggris.
  await page
    .context()
    .addCookies([{ name: 'mmirza-admin-lang', value: 'en', url: testInfo.project.use.baseURL! }])
  const openEnglish = async () => {
    await page.goto('/admin/pages/home')
    await expect(field()).toBeVisible()
  }
  await openEnglish()
  const original = await field().inputValue()
  await expect(async () => {
    await field().fill('Test Role One | Test Role Two')
    await expect(field()).toHaveValue('Test Role One | Test Role Two', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Roles saved.')).toBeVisible()
  // dicek langsung ke server agar cache browser tidak menyajikan halaman lama
  await expect
    .poll(async () => (await page.request.get('/en')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .toContain('Test Role Two')

  // kembalikan agar tes lain tidak terpengaruh
  await openEnglish()
  await expect(async () => {
    await field().fill(original)
    await expect(field()).toHaveValue(original, { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Roles saved.')).toBeVisible()
  await expect
    .poll(async () => (await page.request.get('/en')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .not.toContain('Test Role Two')
})

test('modul Home hanya berisi foto profil, foto utama, dan peran', async ({ page }) => {
  await page.goto('/admin/pages/home')
  for (const title of ['Foto profil', 'Foto utama', 'Peran di bawah foto']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  // armor, judul bagian, dan SEO tidak bisa diubah lagi
  for (const old of ['Armor hero', 'Judul bagian', 'SEO']) {
    await expect(page.getByRole('heading', { name: old, exact: true })).toHaveCount(0)
  }
  // belum ada unggahan: foto utama bawaan bisa diunduh sebagai acuan
  await expect(page.getByRole('link', { name: 'Unduh foto bawaan sebagai acuan' })).toHaveCount(1)
  // foto profil pindah ke Home: tidak dobel di About → Profil
  await page.goto('/admin/profile')
  await expect(page.getByRole('heading', { name: 'Foto profil' })).toHaveCount(0)
  await expect(page.getByLabel('Peran', { exact: true })).toHaveCount(0)
})

test('Bagian Awal: hanya isi kartu pembuka yang bisa diubah', async ({ page }) => {
  await page.goto('/admin/pages/intro')
  await expect(page.getByRole('button', { name: 'Simpan' })).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Isi kartu pembuka' })).toBeVisible()
  await expect(page.getByLabel('Isi', { exact: true })).toBeVisible()
  // judul, saklar tampil, label, dan tombol kartu adalah teks tetap
  await expect(page.getByLabel('Judul', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Tampilkan pemberitahuan pembuka')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Teks di kartu' })).toHaveCount(0)
})

test('About → Pendidikan: form khusus pendidikan, Experience hanya kerja dan organisasi', async ({
  page,
  isMobile,
}) => {
  await page.goto('/admin/education')
  await expect(page.getByRole('link', { name: 'Pendidikan', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  // di layar sempit tabel tampil sebagai kartu tanpa judul kolom
  if (!isMobile)
    await expect(page.getByRole('columnheader', { name: 'Sekolah / kampus' })).toBeVisible()
  await page.goto('/admin/education/new')
  await expect(page.getByLabel('Sekolah / kampus', { exact: true })).toBeVisible()
  // satu isian per bahasa; hanya bahasa isian yang aktif yang terlihat
  await expect(page.getByLabel('Grade / GPA')).toHaveCount(2)
  await expect(page.getByLabel('Grade / GPA').first()).toBeVisible()
  // jenis tetap Pendidikan dan isian khusus kerja disembunyikan
  for (const label of ['Jenis', 'Lokasi (opsional)'])
    await expect(page.getByLabel(label, { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Batal' })).toHaveAttribute(
    'href',
    '/admin/education',
  )
  // pilihan jenis di Experience tanpa Pendidikan
  await page.goto('/admin/experience/new')
  const type = page.getByLabel('Jenis', { exact: true })
  await expect(type.locator('option')).toHaveText(['Kerja', 'Organisasi'])
})

test('skeleton shimmer tampil saat pindah menu admin sampai data siap', async ({ page }) => {
  // data halaman tujuan ditahan sebentar setelah kerangkanya diambil lewat prefetch
  await page.goto('/admin', { waitUntil: 'networkidle' })
  await page.route('**/*', async (route) => {
    const h = route.request().headers()
    // hanya permintaan navigasi; prefetch kerangka halaman tujuan dibiarkan lewat
    if (h['rsc'] === '1' && !h['next-router-prefetch'])
      await new Promise((r) => setTimeout(r, 1500))
    await route.continue().catch(() => {})
  })
  const loading = page.getByRole('status').filter({ hasText: 'Memuat halaman…' })
  const tile = page.getByRole('link', { name: 'Pesan baru' })
  await tile.hover()
  await page.waitForLoadState('networkidle')
  await tile.click()
  await expect(loading).toBeAttached()
  await expect(page.getByRole('heading', { name: 'Pesan', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  await expect(loading).toHaveCount(0)
})

test('tiap topik satu menu: data profil dan project ada sebagai tab modul, bukan menu kedua', async ({
  page,
  isMobile,
}) => {
  await page.goto('/admin/profile')
  await expect(page.getByRole('link', { name: 'Teks halaman' })).toHaveAttribute(
    'href',
    '/admin/pages/about',
  )
  await expect(page.getByRole('link', { name: 'Profil', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  if (!isMobile) {
    const menu = page.getByRole('navigation', { name: 'Menu admin' })
    // nama menu situs berbahasa Indonesia di mode Indonesia (About → Tentang)
    await expect(menu.getByRole('link', { name: 'Tentang' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    // halaman data (profil, project, skill, pengalaman) hanya lewat tab modul, bukan menu sendiri.
    // Dicek lewat alamat: nama menu Projects/Experience di mode Indonesia memang Project/Pengalaman.
    for (const old of ['/admin/profile', '/admin/projects', '/admin/skills', '/admin/experience'])
      await expect(menu.locator(`a[href="${old}"]`)).toHaveCount(0)
  }
})

test('top bar: bahasa admin, tema, dan profil di pojok kanan atas', async ({ page }) => {
  await page.goto('/admin/pages/about')
  const bar = page.getByRole('banner')
  // satu tombol bulat seperti situs publik: kode yang terlihat adalah bahasa tujuan
  const toEnglish = bar.getByRole('button', { name: 'EN, ganti bahasa admin ke English' })
  await expect(toEnglish).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Mode gelap' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Menu profil' })).toBeVisible()
  // nama halaman di top bar, huruf Inter biasa (bukan Oswald kapital; DESIGN.md bagian 113)
  const title = bar.getByText('Tentang', { exact: true })
  await expect(title).toHaveCSS('text-transform', 'none')
  expect(await title.evaluate((el) => getComputedStyle(el).fontFamily)).not.toMatch(/oswald/i)
  // logo dan nama panel pindah ke sidebar; Akun tidak lagi di sidebar (revisi 2026-11-11)
  await expect(bar.getByText('Super Admin', { exact: true })).toHaveCount(0)
  const sidebar = page.getByRole('navigation', { name: 'Menu admin' })
  for (const moved of ['Akun', 'Log audit', 'Pengaturan'])
    await expect(sidebar.getByRole('link', { name: moved })).toHaveCount(0)

  // bahasa admin menentukan kolom yang tampil di form dua bahasa
  await expect(page.getByLabel('Judul (Indonesia)', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Title (English)', { exact: true })).toHaveCount(0)
  // klik sebelum hydration selesai belum berpengaruh; tombol ini bergantian (EN lalu ID), jadi hanya
  // diklik ulang selama masih bertuliskan EN
  await expect(async () => {
    if (await toEnglish.count()) await toEnglish.click()
    // label isian ikut berbahasa Inggris (seluruh tampilan admin, DESIGN.md bagian 115)
    await expect(page.getByLabel('Title (English)', { exact: true })).toBeVisible({ timeout: 1000 })
  }).toPass()
  await expect(page.getByLabel('Judul (Indonesia)', { exact: true })).toHaveCount(0)
  // tampilan admin ikut berganti: menu, top bar, judul halaman dari server, dan html lang
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(bar.getByRole('button', { name: 'Appearance' })).toBeAttached()
  await expect(bar.getByRole('button', { name: 'Dark mode' })).toBeVisible()
  await expect(
    page.getByText('About page. Bio, photo, name, and roles are in the Profile tab.'),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Page text' })).toBeVisible()
  // isi halaman juga berbahasa Inggris: judul kartu dan tombol form
  await expect(page.getByRole('heading', { name: 'Page text', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible()
  await expect(page.getByText('Teks halaman', { exact: true })).toHaveCount(0)
  // dimuat ulang tetap berbahasa Inggris (cookie dibaca server)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('link', { name: 'Page text' })).toBeVisible()
  const profileEn = bar.getByRole('button', { name: 'Profile menu' })
  await profileEn.click()
  // urutan tetap pilihan pemilik: Akun, Pengaturan, Log audit, Lihat situs
  await expect(
    page.locator(`[id="${await profileEn.getAttribute('aria-controls')}"]`).locator('a'),
  ).toHaveText(['Account', 'Settings', 'Audit log', /^View site/])
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  await page.keyboard.press('Escape')
  // kembalikan ke Indonesia
  const toIndonesian = bar.getByRole('button', { name: 'ID, switch admin language to Indonesian' })
  await expect(async () => {
    if (await toIndonesian.count()) await toIndonesian.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'id', { timeout: 1000 })
  }).toPass()
  await expect(page.getByRole('link', { name: 'Teks halaman' })).toBeVisible()

  // menu profil: kepala (nama dan peran), lalu Akun, Pengaturan, Log audit, Lihat situs (Log audit dan
  // Pengaturan pindah dari sidebar, revisi 2026-11-11), dan Keluar berwarna merah paling bawah
  const profile = bar.getByRole('button', { name: 'Menu profil' })
  await profile.click()
  const panel = page.locator(`[id="${await profile.getAttribute('aria-controls')}"]`)
  await expect(panel.getByText('Super Admin', { exact: true })).toBeVisible()
  await expect(panel.locator('a, button')).toHaveText([
    /^Akun$/,
    /^Pengaturan$/,
    /^Log audit$/,
    /^Lihat situs/,
    /^Keluar$/,
  ])
  // warna yang benar-benar tampil, bukan sekadar nama kelas: Keluar merah, beda dari Akun
  const color = (name: string) =>
    panel
      .getByRole(name === 'Keluar' ? 'button' : 'link', { name })
      .evaluate((el) => getComputedStyle(el).color)
  const danger = await panel.evaluate((el) => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--danger)'
    el.append(probe)
    const value = getComputedStyle(probe).color
    probe.remove()
    return value
  })
  expect(await color('Keluar')).toBe(danger)
  expect(await color('Akun')).not.toBe(danger)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Keluar' })).toHaveCount(0)
})

test('kerangka admin tetap: hanya isi panel besar yang digulir', async ({
  page,
  browserName,
  isMobile,
}) => {
  // revisi pemilik 2026-11-11 (DESIGN.md bagian 114): top bar dan sidebar diam, isi digulir di dalam
  // form Project baru selalu lebih tinggi dari layar, tidak bergantung pada jumlah data di database
  // (database CI baru dan hampir kosong, CI #287)
  await page.goto('/admin/projects/new')
  const main = page.locator('main')
  const bar = page.getByRole('banner')
  const before = await bar.boundingBox()
  await expect.poll(() => main.evaluate((el) => el.scrollHeight > el.clientHeight + 100)).toBe(true)
  if (browserName === 'webkit' && isMobile) {
    // roda tetikus tidak didukung WebKit mobile di Playwright: gulir panel isi langsung
    await main.evaluate((el) => el.scrollBy(0, 900))
  } else {
    await main.hover()
    await page.mouse.wheel(0, 900)
  }
  await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBeGreaterThan(200)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(await bar.boundingBox()).toEqual(before)
  // pindah menu: isi halaman baru mulai dari atas lagi
  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBe(0)
})

test.describe('animasi ganti bahasa admin', () => {
  // tes lain mematikan animasi (reducedMotion); di sini animasi harus berjalan
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('judul dari server dan isi kolom form ikut efek acak huruf', async ({ page }) => {
    // permintaan pemilik 2026-11-11 (DESIGN.md bagian 116): SELURUH teks yang berganti ikut efek,
    // termasuk judul halaman yang baru tiba setelah router.refresh() dan isi kolom form. Halaman About:
    // judul dan kolom pertama langsung terlihat di layar biasa (layar sangat tinggi membuat WebKit
    // berskala 2-3x di sandbox hanya menggambar sekitar 1 frame per detik).
    await page.goto('/admin/pages/about')
    // judul besar hanya untuk pembaca layar (DESIGN.md bagian 118); teks server yang terlihat adalah
    // deskripsi halaman
    const idDesc = 'Halaman Tentang. Bio, foto, nama, dan peran ada di tab Profil.'
    const enDesc = 'About page. Bio, photo, name, and roles are in the Profile tab.'
    const h1 = page.locator('main header p')
    await expect(h1).toHaveText(idDesc)
    // rekam setiap teks judul dan isi kolom Judul (nilai atau placeholder) yang tampil, tiap frame
    await page.evaluate(() => {
      const seen = { title: new Set<string>(), field: new Set<string>() }
      // waktu terakhir judul halaman (server) dan nama halaman di top bar (client) berubah
      const last = { title: 0, bar: 0 }
      let prev = { title: '', bar: '' }
      Object.assign(window, { __seen: seen, __last: last })
      const tick = () => {
        const now = {
          title: document.querySelector('main header p')?.textContent ?? '',
          bar: document.querySelector('header p')?.textContent ?? '',
        }
        if (now.title !== prev.title) last.title = performance.now()
        if (now.bar !== prev.bar) last.bar = performance.now()
        prev = now
        seen.title.add(now.title)
        const field = document.querySelector<HTMLInputElement>('#About-title-id, #About-title-en')
        if (field) seen.field.add(field.value || field.placeholder)
        requestAnimationFrame(tick)
      }
      tick()
    })
    const fieldText = async () =>
      page
        .locator('#About-title-id, #About-title-en')
        .evaluate((el: HTMLInputElement) => el.value || el.placeholder)
    const idValue = await fieldText()
    const toEnglish = page.getByRole('button', { name: 'EN, ganti bahasa admin ke English' })
    await expect(async () => {
      if (await toEnglish.count()) await toEnglish.click()
      await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 1000 })
    }).toPass()
    await expect(h1).toHaveText(enDesc)
    await expect(page.locator('#About-title-en')).toBeVisible()
    // tunggu animasi selesai, lalu ambil teks akhir kolom
    await expect.poll(fieldText).not.toMatch(/^$/)
    await page.waitForTimeout(1200)
    const enValue = await fieldText()
    // ada tulisan antara (huruf acak) selain teks lama dan teks baru; judul dari server diacak setelah
    // teksnya tiba, jadi ditunggu
    const between = (key: 'title' | 'field', known: string[]) =>
      page.evaluate(
        ({ key, known }) => {
          const s = (window as unknown as { __seen: Record<string, Set<string>> }).__seen
          return [...s[key]!].filter((v) => v && !known.includes(v)).length
        },
        { key, known },
      )
    await expect.poll(() => between('title', [idDesc, enDesc])).toBeGreaterThan(0)
    await expect.poll(() => between('field', [idValue, enValue])).toBeGreaterThan(0)
    await expect(h1).toHaveText(enDesc)
    // teks dari server dan dari browser selesai mengetik bersamaan (DESIGN.md bagian 117)
    await expect(page.getByRole('banner').getByText('About', { exact: true })).toBeVisible()
    const last = await page.evaluate(
      () => (window as unknown as { __last: Record<string, number> }).__last,
    )
    expect(Math.abs(last.title! - last.bar!)).toBeLessThan(150)
  })
})

test('admin tanpa tulisan biru dan tanpa batang gulir', async ({ page }) => {
  for (const path of ['/admin', '/admin/pages/home', '/admin/profile', '/admin/messages']) {
    await page.goto(path)
    const blue = await page.evaluate(() => {
      const found: string[] = []
      for (const el of document.querySelectorAll('main *, header *, aside *')) {
        if (!(el.textContent ?? '').trim() || el.children.length > 0) continue
        const m = getComputedStyle(el)
          .color.match(/\d+(\.\d+)?/g)
          ?.map(Number)
        if (m && m[2]! > m[0]! + 50 && m[2]! > m[1]! + 25)
          found.push(`${el.tagName} ${el.textContent!.trim().slice(0, 30)}`)
      }
      return found
    })
    expect(blue, `${path} berisi tulisan biru`).toEqual([])
    // batang gulir menyisakan selisih lebar; disembunyikan berarti selisihnya nol
    const gutter = await page.evaluate(
      () => window.innerWidth - document.documentElement.clientWidth,
    )
    expect(gutter, `${path} masih punya batang gulir`).toBe(0)
    // isi halaman digulir di dalam panel besar; batang gulirnya juga disembunyikan
    const inner = await page
      .locator('main')
      .evaluate((el: HTMLElement) => el.offsetWidth - el.clientWidth)
    expect(inner, `${path} panel isi masih punya batang gulir`).toBe(0)
  }
})
